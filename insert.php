<?php

require("login.php");

$mysqli= new mysqli( $host, $username, $password, $database);
if ($mysqli->connect_errno) {
echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
}

$sql="REPLACE INTO caches (code, name, owner,latitude,longitude,altitude,kind,size,difficulty,terrain,favorites,founds,not_founds,state,county,publish,status,last_log)
VALUES
('$_POST[code]','$_POST[name]','$_POST[owner]','$_POST[latitude]','$_POST[longitude]','$_POST[altitude]','$_POST[kind]','$_POST[size]','$_POST[difficulty]','$_POST[terrain]','$_POST[favorites]','$_POST[founds]','$_POST[not_founds]','$_POST[state]','$_POST[county]','$_POST[publish]','$_POST[status]','$_POST[last_log]')";

$result = $mysqli->query($sql);
if (!$result) {
die('Invalid query: ' . $mysqli->error);
}
$mysqli->close();

header('location: http://localhost/projeto/AlreadyNotSoSimpleMap.html');

exit;
?>