
define(function(require, exports, module) {
	var sm4Js = require('./sm4');
/**
 * 在字符串不足（total）时，左边补值（pad）
 */
String.prototype.GmPadLeft =  function(total, pad) {
	return (Array(total).join(pad || 0) + this).slice(-total);
  }
  /**
   * inputStr
   * len   
   * 返回8个字符（16字节）的密钥
   */
  function gmSm4Key(inputStr,len){
	 var tmpKey = "";
	 var sm4Key = "";
	 var reg =/[\u4e00-\u9fa5]/g;
	 //1.替除中文
	 tmpKey = inputStr.replace(reg,"") ;  
	 //2.判断长度，不足，补足
	 if ( tmpKey.length > len ) {
		 sm4Key = tmpKey.substring(0,len)
	 }else if(tmpKey.length < len ){
		 sm4Key = tmpKey.GmPadLeft(len,"0") 
	 }else {
		sm4Key = tmpKey;
	 }
	//返回key
	return sm4Key
  }
  
	/**
	 * 返回用户加密的用户密码
	 */
	function Encrypt(tmpKey,plainText){
		var sm4 = new sm4Js.SM4Util();
		var sm4Key = "";     //加密密钥
		var cipherText = ""; //加密密文
		//取得密钥
		sm4Key = gmSm4Key(tmpKey,16);
		//机密
		cipherText = sm4.sm4Encrypt(sm4Key, plainText);
		return cipherText; 
	}
	var sm4Pad = {
	Encrypt :Encrypt
	};
	module.exports = sm4Pad
});