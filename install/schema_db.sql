
CREATE TABLE calls (
  id int(10) NOT NULL AUTO_INCREMENT,
  hash_call_id varchar(100) DEFAULT NULL,
  caller varchar(30) DEFAULT NULL,
  called varchar(30) DEFAULT NULL,
  dst varchar(30) DEFAULT NULL,
  type varchar(30) DEFAULT NULL,
  status varchar(30) DEFAULT NULL,
  begin datetime DEFAULT NULL,
  duration int(10) DEFAULT NULL,
  billsec int(10) DEFAULT NULL,
  calldata blob, 
  CHECK (JSON_VALID(calldata)), 
  PRIMARY KEY (id),
  UNIQUE KEY hash_call_id (hash_call_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE statistics (
  id int(10) NOT NULL AUTO_INCREMENT,
  name  varchar(100) DEFAULT NULL,
  value varchar(30) DEFAULT NULL,
  last_update datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
