-- ============================================================
-- 청소 당번: 하루에 구역을 여러 개 둘 수 있게 한다
--
-- 기존 PK 가 (classroom_id, weekday) 라 요일당 한 줄만 가능했다.
-- 대리 키(id)를 두고 PK 를 옮겨 같은 요일에 여러 구역을 넣을 수 있게 한다.
-- ============================================================

alter table public.duties
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.duties drop constraint if exists duties_pkey;
alter table public.duties add primary key (id);

-- 화면에 보여줄 순서 (구역을 추가한 순서 유지)
alter table public.duties
  add column if not exists sort_order smallint not null default 0;

create index if not exists duties_classroom_weekday_idx
  on public.duties (classroom_id, weekday, sort_order);
