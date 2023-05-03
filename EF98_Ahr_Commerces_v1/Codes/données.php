<?php
    $file = $_REQUEST["q"];
    $data = file_get_contents($file);
    echo $data;
?>
