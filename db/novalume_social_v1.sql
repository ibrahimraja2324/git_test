-- Novalume isolated social namespace in an existing user-owned Supabase project.
-- All objects are prefixed. Existing other application tables are left unchanged.
-- Public content is truly public; private diary content stays under strict RLS.
create table if not exists public.novalume_works (
 id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,90}$'),
 title text not null check(length(title) between 1 and 220),
 author text not null,
 original_language text not null,
 source_url text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.novalume_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check (handle ~ '^[a-z][a-z0-9_]{2,23}$'),
 display_name text not null check(length(display_name) between 1 and 70),
 bio text not null default '' check(length(bio)<=280),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.novalume_diary (
 user_id uuid not null references auth.users(id) on delete cascade,
 work_id text not null references public.novalume_works(id) on delete cascade,
 status text not null check(status in ('Plan to read','Reading','Completed','On hold','Dropped')),
 chapter integer not null default 0 check(chapter between 0 and 1000000),
 rating numeric(2,1) check(rating is null or (rating between 0.5 and 5 and rating*2=trunc(rating*2))),
 note text not null default '' check(length(note)<=500),
 review text not null default '' check(length(review)<=1200),
 review_spoiler boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key (user_id,work_id)
);
create table if not exists public.novalume_reviews (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 work_id text not null references public.novalume_works(id) on delete cascade,
 rating numeric(2,1) not null check(rating between 0.5 and 5 and rating*2=trunc(rating*2)),
 body text not null check(length(trim(body)) between 30 and 2000),
 spoiler boolean not null default false,
 visible boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,work_id)
);
create table if not exists public.novalume_follows (
 follower_id uuid not null references auth.users(id) on delete cascade,
 followed_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (follower_id, followed_id),
 check(follower_id<>followed_id)
);
create table if not exists public.novalume_review_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 review_id uuid not null references public.novalume_reviews(id) on delete cascade,
 reason text not null check(reason in ('spoiler-unmarked','spam','harassment','copyright','other')),
 details text not null default '' check(length(details)<=500),
 created_at timestamptz not null default now(),
 unique(reporter_id,review_id)
);
create index if not exists novalume_reviews_public_work_idx on public.novalume_reviews(work_id,created_at desc) where visible=true;
create index if not exists novalume_reviews_user_idx on public.novalume_reviews(user_id);
create index if not exists novalume_follows_followed_idx on public.novalume_follows(followed_id);
create index if not exists novalume_reports_review_idx on public.novalume_review_reports(review_id);
alter table public.novalume_works enable row level security;
alter table public.novalume_profiles enable row level security;
alter table public.novalume_diary enable row level security;
alter table public.novalume_reviews enable row level security;
alter table public.novalume_follows enable row level security;
alter table public.novalume_review_reports enable row level security;
revoke all on public.novalume_works,public.novalume_profiles,public.novalume_diary,
 public.novalume_reviews,public.novalume_follows,public.novalume_review_reports from PUBLIC,anon,authenticated;
grant select on public.novalume_works,public.novalume_profiles,public.novalume_reviews,
 public.novalume_follows to anon,authenticated;
grant insert,update on public.novalume_profiles,public.novalume_diary,public.novalume_reviews to authenticated;
grant delete on public.novalume_profiles,public.novalume_diary,public.novalume_reviews to authenticated;
grant select on public.novalume_diary,public.novalume_review_reports to authenticated;
grant insert on public.novalume_follows,public.novalume_review_reports to authenticated;
grant delete on public.novalume_follows,public.novalume_review_reports to authenticated;
-- Only actual permanent users may create social content, not anonymous auth sessions.
create policy nov_works_read on public.novalume_works for select to anon,authenticated using (true);
create policy nov_profiles_read on public.novalume_profiles for select to anon,authenticated using (true);
create policy nov_profiles_insert on public.novalume_profiles for insert to authenticated
 with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_profiles_update on public.novalume_profiles for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_profiles_delete on public.novalume_profiles for delete to authenticated
 using(user_id=(select auth.uid()));
create policy nov_diary_select on public.novalume_diary for select to authenticated
 using(user_id=(select auth.uid()));
create policy nov_diary_insert on public.novalume_diary for insert to authenticated
 with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_diary_update on public.novalume_diary for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_diary_delete on public.novalume_diary for delete to authenticated
 using(user_id=(select auth.uid()));
create policy nov_reviews_read on public.novalume_reviews for select to anon,authenticated
 using(visible=true or user_id=(select auth.uid()));
create policy nov_reviews_insert on public.novalume_reviews for insert to authenticated
 with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_reviews_update on public.novalume_reviews for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_reviews_delete on public.novalume_reviews for delete to authenticated
 using(user_id=(select auth.uid()));
create policy nov_follows_read on public.novalume_follows for select to anon,authenticated using(true);
create policy nov_follows_insert on public.novalume_follows for insert to authenticated
 with check(follower_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_follows_delete on public.novalume_follows for delete to authenticated
 using(follower_id=(select auth.uid()));
create policy nov_reports_read on public.novalume_review_reports for select to authenticated
 using(reporter_id=(select auth.uid()));
create policy nov_reports_insert on public.novalume_review_reports for insert to authenticated
 with check(reporter_id=(select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy nov_reports_delete on public.novalume_review_reports for delete to authenticated
 using(reporter_id=(select auth.uid()));
-- Only data curated in source registry, never invented works, can receive reviews.
insert into public.novalume_works (id,title,author,original_language,source_url) values
('lord-of-the-mysteries','Lord of the Mysteries','Cuttlefish That Loves Diving','Chinese','https://www.novelupdates.com/series/lord-of-the-mysteries/'),
('reverend-insanity','Reverend Insanity','Gu Zhen Ren','Chinese','https://www.novelupdates.com/series/reverend-insanity/'),
('i-shall-seal-the-heavens','I Shall Seal the Heavens','Er Gen','Chinese','https://www.novelupdates.com/series/i-shall-seal-the-heavens/'),
('coiling-dragon','Coiling Dragon','I Eat Tomatoes','Chinese','https://www.novelupdates.com/series/coiling-dragon/'),
('release-that-witch','Release That Witch','Er Mu','Chinese','https://www.novelupdates.com/series/release-that-witch/'),
('the-legendary-mechanic','The Legendary Mechanic','Qi Peijia','Chinese','https://www.novelupdates.com/series/the-legendary-mechanic/'),
('omniscient-readers-viewpoint','Omniscient Reader''s Viewpoint','Sing n Song','Korean','https://www.novelupdates.com/series/omniscient-readers-viewpoint/'),
('the-novels-extra','The Novel''s Extra','Jee Gab Song','Korean','https://www.novelupdates.com/series/the-novels-extra/'),
('trash-of-the-counts-family','Trash of the Count''s Family','Yu Ryeo Han','Korean','https://www.novelupdates.com/series/trash-of-the-counts-family/'),
('the-second-coming-of-gluttony','The Second Coming of Gluttony','Ro Yu-jin','Korean','https://www.wuxiaworld.com/novel/the-second-coming-of-gluttony/'),
('sss-class-suicide-hunter','SSS-Class Suicide Hunter','Sinnoa','Korean','https://www.novelupdates.com/series/sss-class-suicide-hunter/'),
('mother-of-learning','Mother of Learning','nobody103','English','https://www.royalroad.com/fiction/21220/mother-of-learning'),
('the-perfect-run','The Perfect Run','Maxime J. Durand (Void Herald)','English','https://www.royalroad.com/fiction/36735/the-perfect-run'),
('beware-of-chicken','Beware of Chicken','Casualfarmer','English','https://www.royalroad.com/fiction/39408/beware-of-chicken'),
('super-supportive','Super Supportive','Sleyca','English','https://www.royalroad.com/fiction/63759/super-supportive'),
('the-primal-hunter','The Primal Hunter','Zogarth','English','https://www.royalroad.com/fiction/36049/the-primal-hunter'),
('defiance-of-the-fall','Defiance of the Fall','TheFirstDefier','English','https://www.royalroad.com/fiction/24709/defiance'),
('he-who-fights-with-monsters','He Who Fights with Monsters','Shirtaloon (Travis Deverell)','English','https://www.royalroad.com/fiction/26294/he-who-fights'),
('azarinth-healer','Azarinth Healer','Rhaegar','English','https://www.royalroad.com/fiction/16946/azarinth-healer'),
('the-runesmith','The Runesmith','Kuropon','English','https://www.royalroad.com/fiction/33844/the-runesmith'),
('chrysalis','Chrysalis','RinoZ','English','https://www.royalroad.com/fiction/22518/chrysalis'),
('the-beginning-after-the-end','The Beginning After the End','TurtleMe','English','https://www.royalroad.com/fiction/3909/the-beginning-after-the-end'),
('beneath-the-dragoneye-moons','Beneath the Dragoneye Moons','Selkie','English','https://www.royalroad.com/fiction/36299/beneath-the-dragoneye-moons'),
('the-calamitous-bob','The Calamitous Bob','Mecanimus','English','https://www.royalroad.com/fiction/44132/the-calamitous-bob'),
('the-path-of-ascension','The Path of Ascension','C_Mantis','English','https://www.royalroad.com/fiction/40920/the-path-of-ascension'),
('a-journey-of-black-and-red','A Journey of Black and Red','Mecanimus','English','https://www.royalroad.com/fiction/26675/a-journey-of-black-and-red'),
('dungeon-life','Dungeon Life','Khenal','English','https://www.royalroad.com/fiction/54476/dungeon-life'),
('the-daily-grind','The Daily Grind','argusthecat','English','https://www.royalroad.com/fiction/15925/the-daily-grind'),
('vainqueur-the-dragon','Vainqueur the Dragon','Maxime J. Durand (Void Herald)','English','https://www.royalroad.com/fiction/26534/vainqueur-the-dragon'),
('book-of-the-dead','Book of the Dead','RinoZ','English','https://www.royalroad.com/fiction/47038/book-of-the-dead'),
('reborn-as-a-demonic-tree','Reborn as a Demonic Tree','XKARNATION','English','https://www.royalroad.com/fiction/62881/reborn-as-a-demonic-tree'),
('millennial-mage','Millennial Mage','JLMullins','English','https://www.royalroad.com/fiction/47826/millennial-mage'),
('all-the-skills','All the Skills','HonourRae','English','https://www.royalroad.com/fiction/55687/all'),
('jackal-among-snakes','Jackal Among Snakes','Nemorosus','English','https://www.royalroad.com/fiction/48969/jackal-among-snakes-stubbing-nov-15th'),
('industrial-strength-magic','Industrial Strength Magic','Macronomicon','English','https://www.royalroad.com/fiction/57011/industrial-strength-magic'),
('a-will-eternal','A Will Eternal','Er Gen','Chinese','https://www.wuxiaworld.com/novel/a-will-eternal'),
('renegade-immortal','Renegade Immortal','Er Gen','Chinese','https://www.wuxiaworld.com/novel/renegade-immortal'),
('martial-world','Martial World','Cocooned Cow','Chinese','https://www.wuxiaworld.com/novel/martial-world'),
('true-martial-world','True Martial World','Cocooned Cow','Chinese','https://www.novelupdates.com/series/true-martial-world/'),
('overgeared','Overgeared','Park Saenal','Korean','https://www.wuxiaworld.com/novel/overgeared'),
('everyone-else-is-a-returnee','Everyone Else is a Returnee','Toika','Korean','https://www.novelupdates.com/series/everyone-else-is-a-returnee/'),
('the-return-of-the-disaster-class-hero','The Return of the Disaster-Class Hero','SAN.G','Korean','https://www.novelupdates.com/series/the-return-of-the-disaster-class-hero/'),
('the-regressed-demon-lord-is-kind','The Regressed Demon Lord is Kind','Hungry Panda','Korean','https://www.wuxiaworld.com/novel/the-regressed-demon-lord-is-kind'),
('damn-reincarnation','Damn Reincarnation','Mokma (목마)','Korean','https://www.wuxiaworld.com/novel/damn-reincarnation'),
('second-life-ranker','Second Life Ranker','Sadoyeon (사도연)','Korean','https://www.wuxiaworld.com/novel/second-life-ranker'),
('return-of-mount-hua-sect','Return of Mount Hua Sect','Biga (비가)','Korean','https://www.novelupdates.com/series/return-of-mount-hua-sect/'),
('the-s-classes-that-i-raised','The S-Classes That I Raised','Geunseo (근서)','Korean','https://www.novelupdates.com/series/the-s-classes-that-i-raised/'),
('nine-star-hegemon-body-art','Nine Star Hegemon Body Art','Ordinary Magician (平凡魔术师)','Chinese','https://www.wuxiaworld.com/novel/nine-star-hegemon'),
('desolate-era','Desolate Era','I Eat Tomatoes (我吃西红柿)','Chinese','https://www.wuxiaworld.com/novel/desolate-era'),
('against-the-gods','Against the Gods','Mars Gravity (火星引力)','Chinese','https://www.wuxiaworld.com/novel/against-the-gods'),
('warlock-of-the-magus-world','Warlock of the Magus World','The Plagiarist (文抄公)','Chinese','https://www.wuxiaworld.com/novel/warlock-of-the-magus-world'),
('tales-of-demons-and-gods','Tales of Demons & Gods','Mad Snail (发飙的蜗牛)','Chinese','https://www.wuxiaworld.com/novel/tales-of-demons-and-gods'),
('a-record-of-a-mortals-journey-to-immortality','A Record of a Mortal''s Journey to Immortality','Wang Yu (忘语)','Chinese','https://www.wuxiaworld.com/novel/rmji'),
('a-record-of-a-mortals-journey-to-immortality-immortal-realm','A Record of a Mortal''s Journey to Immortality: Immortal Realm','Wang Yu (忘语)','Chinese','https://www.wuxiaworld.com/novel/rmjiir')
on conflict (id) do update set title=excluded.title,author=excluded.author,
 original_language=excluded.original_language,source_url=excluded.source_url;
