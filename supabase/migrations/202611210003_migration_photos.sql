create table autodeal_private.pending_photo_imports(
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  source_photo_id text not null,
  primary key(vehicle_id,source_photo_id)
);
alter table autodeal_private.pending_photo_imports enable row level security;
revoke all on autodeal_private.pending_photo_imports from public,anon,authenticated;

create or replace function autodeal_private.vehicle_view(vehicle public.vehicles, include_private boolean)
returns jsonb language sql stable set search_path = ''
as $$
 select (case when include_private then vehicle.data else vehicle.data - 'plate' end)
   || jsonb_build_object('id',vehicle.id::text,'ref','AD94-'||lpad(vehicle.id::text,greatest(3,length(vehicle.id::text)),'0'),
       'status',vehicle.status,'revision',vehicle.revision,'updatedAt',vehicle.updated_at)
   || case when include_private then jsonb_build_object('pendingPhotoCount',
       case when jsonb_array_length(vehicle.data->'photos')>0 then 0
       else (select count(*) from autodeal_private.pending_photo_imports where vehicle_id=vehicle.id) end)
       else '{}'::jsonb end;
$$;
