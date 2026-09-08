create table users (
    id uuid primary key default gen_random_uuid(),
    username text not null unique check(char_length(username)<=30),
    email text not null unique check(char_length(email)<=255),
    -- we must limit the length of username and email because they are coming from the user,
    -- we cant trust the user for always giving valid values
    -- this is to prevent user from storing unlimited data
    -- so our database does'nt run out of already limited storage
    password_hash text not null,
    -- hash the password ofcourse
    created_at timestamptz not null default now()
);

create table pets(
    id UUID primary key default gen_random_uuid(),
    current_owner_id UUID references users(id) on delete set null,
    -- can be set null so we can track if this pet is in the store available to be adopted or not
    
    name text not null check(char_length(name)<=40),
    -- limits the text length because this comes from users
    species text not null,
    age numeric(5,2) not null default 0 check(age>=0),
    life_span_years numeric(5,2) not null default 0 check(life_span_years>=0),
    diet text not null check(diet in ('carnivore','herbivore','omnivore')),

    is_hungry boolean not null default false,
    is_asleep boolean not null default false,
    is_sick boolean not null default false,
    is_healing boolean not null default false,
    sickness_started_at timestamptz,
    sickness_lift_at timestamptz,
    is_dead boolean not null default false,
    date_of_death timestamptz,
    reason_of_death text,


    hp numeric(9,2) not null check(hp>=0),
    max_hp numeric(9,2) not null check(max_hp>=0),
    appetite numeric(5,2) not null default 0 check(appetite between 0 and 100),
    calories_needed integer not null check(calories_needed>=0),
    calories_consumed integer not null  default 0 check(calories_consumed>=0),
    days_underfed integer not null default 0 check(days_underfed>=0),
    bond numeric(5,2) not null default 50 check(bond between 0 and 100),
    stress numeric(5,2) not null default 0 check(stress between 0 and 100),

    last_ticked_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create table refresh_tokens(
    -- multiple tokens can be created per device that access the account
    -- this2 is so that we can handle logout feature in future so we delete the session that user wants to
    -- or they can opt to logout their device from all the devices wether its their or not
    id UUID primary key default gen_random_uuid(),
    user_id UUID not null references users(id) on delete cascade,
    -- delete the id if the user deletes their account
    token_hash text not null unique,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
    -- this table is used to store the refresh token,
    -- used to ask for an access token again when the access token expires
);
-- indexing because pg doesnt index the foregn key and indexing is a good thing to have
-- when we are querrying the database so it gets checked / found fast
create index idx_refresh_tokens_user on refresh_tokens(user_id);



create table ownership_history(
    id UUID primary key default gen_random_uuid(),
    -- unique identifier for each owner that ever owned the pet,
    -- used such that 1 pet can have multiple owners
    -- one to many relationship

    pet_id UUID not null references pets(id) on delete cascade,
    -- foreign key of the pet pulled from the pet table
    user_id UUID references users(id) on delete set null,
    -- user id of the owner of pet foreign key
    username_snapshot text not null,
    -- this is stored as a fallback if the user deletes their account we show this one,
    -- that is why its separtely stored
    adopted_at timestamptz not null default now(),
    -- time when adopted
    abandoned_at timestamptz
    -- time when pet sent to store
);

create index idx_ownership_pet on ownership_history(pet_id);
create index idx_ownership_owner on ownership_history(user_id);


create table foods(
    id UUID primary key default gen_random_uuid(),
    name text not null unique,
    calories_provided integer not null check(calories_provided>=0),
    diet text not null check(diet in ('carnivore','herbivore','omnivore'))
);

create index idx_pets_current_owner on pets(current_owner_id);
create index idx_pets_store on pets(current_owner_id,is_dead) where current_owner_id is null and is_dead = false;
