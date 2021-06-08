<?php

require("login.php");

// Create connection
$conn = new mysqli($host, $username, $password, $database);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$id=$_POST['code'];
// sql to delete a record
$sql = "DELETE FROM caches WHERE code = $id ";

if ($conn->query($sql) === TRUE) {
    echo "Record deleted successfully";
} else {
    echo "Error deleting record: " . $conn->error;
}

$conn->close();

header('location: http://localhost/projeto/AlreadyNotSoSimpleMap.html');

exit;
?>