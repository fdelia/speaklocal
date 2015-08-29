for (var n = 1; n <= 100; n += 1) {

	$('textarea')[0].value = 'a';
	$('button:last')[0].click();

}





function comment(n){
	if (n<= 0) return;

	$('textarea')[0].value = 'a';
	$('button:last')[0].click();
	if (n%100===0) console.log(n);
	setTimeout(function(){
		comment(n-1);
	}, 250);	
}
comment(1000);


