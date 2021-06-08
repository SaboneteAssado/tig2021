<?php

require("login.php");

// Start XML file, create parent node
$dom = new DOMDocument("1.0");
$node = $dom->createElement("caches");
$parnode = $dom->appendChild($node);

// Opens a connection to a MySQL server and database

$mysqli= new mysqli($host, $username, $password, $database);
if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
}

// Select all the rows in the markers table
$query = "SELECT * FROM caches";
$result = $mysqli->query($query);
if (!$result) {  
  die('Invalid query: ' . $mysqli->error);
}

header("Content-type: text/xml");

// Iterate through the rows, adding XML nodes for each
while ($row = @mysqli_fetch_assoc($result)){  
  // ADD TO XML DOCUMENT NODE  
	$node = $dom->createElement("cache");  
	$newnode = $parnode->appendChild($node);
	
	$newnode->setAttribute("code",$row['code']);  
	$newnode->setAttribute("name",$row['name']);
	$newnode->setAttribute("owner",$row['owner']);
	$newnode->setAttribute("latitude", $row['latitude']);  
	$newnode->setAttribute("longitude", $row['longitude']);
	$newnode->setAttribute("altitude", $row['altitude']);
	$newnode->setAttribute("kind", $row['kind']);
	$newnode->setAttribute("size", $row['size']);
	$newnode->setAttribute("difficulty", $row['difficulty']);
	$newnode->setAttribute("terrain", $row['terrain']);
	$newnode->setAttribute("favorites", $row['favorites']);
	$newnode->setAttribute("founds", $row['founds']);
	$newnode->setAttribute("not_founds", $row['not_founds']);
	$newnode->setAttribute("state", $row['state']);
	$newnode->setAttribute("county", $row['county']);
	$newnode->setAttribute("publish", $row['publish']);
	$newnode->setAttribute("last_log", $row['last_log']);
	$newnode->setAttribute("status", $row['status']);
}  

echo $dom->saveXML();
/*
$query = "SELECT * FROM tig WHERE size='Micro'";
$result = $mysqli->query($query);
if (!$result) {  
  die('Invalid query: ' . $mysqli->error);
} 
*/
?>

