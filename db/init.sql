create table if not exists posts (
  post_id integer not null primary key autoincrement,
  user_id integer ,
  board_id integer not null,
  parent_post_id integer,
  content text,
  post_number integer not null,
  time text
);
