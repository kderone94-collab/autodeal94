alter table public.vehicles drop constraint vehicles_status_check;
alter table public.vehicles add constraint vehicles_status_check check (status in ('brouillon','disponible','reserve','prochainement','vendu','archive'));
CREATE OR REPLACE FUNCTION public.autodeal_catalog()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'vehicles',coalesce((select jsonb_agg(autodeal_private.vehicle_view(v,false) order by v.id desc)
      from public.vehicles v where not v.deleted and v.status in ('disponible','reserve','prochainement','vendu')),'[]'::jsonb),
    'phone',coalesce((select value from public.settings where key='phone'),'')
  );
$function$
;
CREATE OR REPLACE FUNCTION public.autodeal_photo_is_published(object_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists(select 1 from public.vehicles v,
   jsonb_array_elements(v.data->'photos') photo
   where not v.deleted and v.status in ('disponible','reserve','prochainement','vendu') and photo->>'path'=object_name);
$function$
;
CREATE OR REPLACE FUNCTION public.autodeal_save_vehicle(p_payload jsonb, p_id bigint DEFAULT NULL::bigint, p_revision integer DEFAULT NULL::integer, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_variable
declare
 data jsonb := '{}'::jsonb;
 current_vehicle public.vehicles;
 saved public.vehicles;
 field_name text;
 field_value text;
 maximum integer;
 selected_status text := coalesce(p_payload->>'status','brouillon');
 photo jsonb;
 photo_id text;
 photos jsonb := '[]'::jsonb;
 extras jsonb := '[]'::jsonb;
 option_name text;
 year_value integer;
 km_value integer;
 price_value integer;
begin
 if not public.autodeal_is_seller() then raise exception 'Accès réservé au vendeur.' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text)>100000
 then raise exception 'Annonce invalide ou trop volumineuse.'; end if;
 if selected_status not in ('brouillon','disponible','reserve','prochainement','vendu','archive')
 then raise exception 'Statut invalide.'; end if;
 for field_name, maximum in select * from (values
   ('brand',60),('model',100),('trim',150),('plate',15),('power',30),('color',60),('interior',60),('description',10000)) as fields(name,max_length)
 loop
   field_value := btrim(coalesce(p_payload->>field_name,''));
   if length(field_value)>maximum then raise exception 'Le champ % est trop long.',field_name; end if;
   data := data || jsonb_build_object(field_name,field_value);
 end loop;
 if data->>'brand'='' or data->>'model'='' then raise exception 'Indiquez la marque et le modèle.'; end if;
 year_value := autodeal_private.number_field(p_payload,'year',1900,extract(year from now())::integer+1);
 km_value := autodeal_private.number_field(p_payload,'km',0,2000000);
 price_value := autodeal_private.number_field(p_payload,'price',0,10000000);
 data := data || jsonb_build_object('year',year_value,'km',km_value,'price',price_value,
   'doors',autodeal_private.number_field(p_payload,'doors',2,7),
   'type',coalesce(p_payload->>'type',''),'fuel',coalesce(p_payload->>'fuel',''),'gearbox',coalesce(p_payload->>'gearbox',''));
 if data->>'type' not in ('','Citadine','Berline','SUV / 4x4','Break','Coupé','Cabriolet','Monospace','Utilitaire')
 or data->>'fuel' not in ('','Essence','Diesel','Hybride','Hybride rechargeable','Électrique','GPL')
 or data->>'gearbox' not in ('','Manuelle','Automatique') then raise exception 'Caractéristiques invalides.'; end if;
 if jsonb_typeof(p_payload->'extras') is distinct from 'array' or jsonb_array_length(p_payload->'extras')>100
 then raise exception 'Maximum 100 équipements par véhicule.'; end if;
 for option_name in select distinct btrim(value) from jsonb_array_elements_text(p_payload->'extras')
 loop
   if length(option_name)>100 then raise exception 'Nom d’équipement trop long.'; end if;
   if option_name<>'' then extras := extras || to_jsonb(option_name); end if;
 end loop;
 if jsonb_typeof(p_payload->'photos') is distinct from 'array' or jsonb_array_length(p_payload->'photos')>20
 then raise exception 'Maximum 20 photos par véhicule.'; end if;
 for photo in select value from jsonb_array_elements(p_payload->'photos')
 loop
   photo_id := photo->>'id';
   if photo_id ~ '^demo-(208|clio|golf|yaris|bmw|a3)$' then
      photos := photos || jsonb_build_array(jsonb_build_object('id',photo_id,'url','/img/'||substr(photo_id,6)||'.webp'));
   elsif photo_id ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
     and exists(select 1 from storage.objects where bucket_id='vehicle-photos' and name='vehicles/'||photo_id||'.jpg')
   then
     photos := photos || jsonb_build_array(jsonb_build_object('id',photo_id,'path','vehicles/'||photo_id||'.jpg'));
   else raise exception 'Une photo manque. Ajoutez-la de nouveau.'; end if;
 end loop;
 if (select count(distinct p->>'id') from jsonb_array_elements(photos) p) <> jsonb_array_length(photos)
 then raise exception 'Photos en double.'; end if;
 if selected_status in ('disponible','reserve') and (
     year_value is null or km_value is null or coalesce(price_value,0)<=0 or data->>'type'=''
     or data->>'fuel'='' or data->>'gearbox'='' or jsonb_array_length(photos)=0)
 then raise exception 'Pour publier, complétez l’année, le kilométrage, le prix, le type, la motorisation, la boîte et ajoutez une photo.'; end if;
 data := data || jsonb_build_object('photos',photos,'extras',extras);
 if p_id is null then
   if p_request_id is null then raise exception 'Identifiant de sauvegarde manquant.'; end if;
   insert into public.vehicles(seed_key,status,data) values(p_request_id::text,selected_status,data)
     on conflict(seed_key) do nothing returning * into saved;
   if saved.id is null then
     select * into saved from public.vehicles where seed_key=p_request_id::text;
     if saved.deleted then raise exception 'Cette annonce a été supprimée.'; end if;
   end if;
 else
   select * into current_vehicle from public.vehicles where id=p_id and not deleted for update;
   if not found then raise exception 'Annonce introuvable.'; end if;
   if p_revision is null or p_revision <> current_vehicle.revision
   then raise exception 'Cette annonce a changé sur un autre appareil. Rechargez la liste avant de la modifier.'; end if;
   update public.vehicles set data=data, status=selected_status, revision=revision+1, updated_at=now()
     where id=p_id returning * into saved;
 end if;
 for option_name in select value from jsonb_array_elements_text(extras)
 loop insert into public.equipment(name) values(option_name) on conflict do nothing; end loop;
 return jsonb_build_object('vehicle',autodeal_private.vehicle_view(saved,true));
end;
$function$
;
