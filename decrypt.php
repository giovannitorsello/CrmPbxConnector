<?php 

define('AES_METHOD', 'aes-256-cbc');
define('IV_SIZE', 16);
define('PASSWORD_SIZE', 32);

function RandomPassword($len)
{
    $chars_set = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $password = '';
    for ($i = 0; $i <$len; $i++) {$password.= $chars_set[rand(0, strlen($chars_set)-1)];}
    return $password;
}

//must by 32 character
$password =RandomPassword(32);

//$server="www.wifinetcom.net";
$server="www.wifinetcom.net";
//URL ANSWERED CALLS
$url_ans="http://".$server.":8088/get_today_answered_calls?password=".$password;

//URL NO ANSWER CALLS
$url_noans="http://".$server.":8088/get_today_noanswer_calls?password=".$password;
//echo $url_noans;

//Download encrypted data - no answer calls
$crypted_data =  file_get_contents($url_noans);


//parse iv and crypted data
$iv_size    = openssl_cipher_iv_length(AES_METHOD);
$iv=substr ($crypted_data , 0 , $iv_size );
$crypted_data=substr ($crypted_data , $iv_size+1);

//bin conversion for chiper_data
$crypted_data_bin = hex2bin($crypted_data);

//decrypting
$decrypt=openssl_decrypt($crypted_data_bin, AES_METHOD, $password, OPENSSL_RAW_DATA, $iv);

//print
echo $decrypt;
echo "\n";

?>
