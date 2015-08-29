for (n = 1; n <= 1000; n += 1) {

	$('input')[0].value = 'auto test ' + n;
	$('textarea')[0].value = 'auto test ' + n;
	$('input').trigger('input');
	$('textarea').trigger('input');
	$('button')[0].click();
	if (n%100 === 0) console.log(n);

}