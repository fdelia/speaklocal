for (var i=1; i<=100; i+=1){
	document.getElementsByTagName('input')[0].value = 'post '+i;
	document.getElementsByTagName('textarea')[0].value = 'some text';
	document.getElementsByTagName('button')[0].click();
}