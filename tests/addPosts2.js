for (n = 1; n <= 10000; n += 1) {

	$('input')[0].value = 'auto test ' + n;
	$('textarea')[0].value = 'auto test ' + n;
	$('input').trigger('input');
	$('textarea').trigger('input');
	$('button')[0].click();

}