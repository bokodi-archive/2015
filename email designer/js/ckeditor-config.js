CKEDITOR.config.toolbar = [
	{
		name: 'row1',
		groups: [ 'row1', 'cleanup' ],
		items: [ 'Bold', 'Italic', 'Underline', 'Link', 'Unlink', 'Image', 'NumberedList', 'BulletedList', 'PasteText', 'PasteFromWord', 'RemoveFormat', 'Source' ]
	},
	
	'/',
	
	{
		name: 'row2',
		groups: [ 'row1', 'cleanup' ],
		items: ['Styles', '-', 'Font', 'FontSize', 'TextColor','BGColor', 'HorizontalRule', 'Anchor', 'Align', 'BidiLtr', 'BidiRtl', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'Justify', 'spellchecker', 'Undo', 'Redo' ]
	}
];
