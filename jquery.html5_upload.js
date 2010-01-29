(function($) {
	jQuery.fn.html5_upload = function(options) {
		var STATUSES = {
			'STARTED':		'Запуск',
			'PROGRESS':		'Загрузка',
			'LOADED':		'Обработка',
			'FINISHED':		'Завершено'
		};
		
		var options = jQuery.extend({
			events: {
				onStart: function(event, total) {
				},
				onStartOne: function(event, name, number, total) {
				},
				onProgress: function(event, progress, name, number, total) {
				},
				onFinishOne: function(event, response, name, number, total) {
				},
				onFinish: function(event, total) {
				},
				onError: function(event, name, error) {
				}
			},
			autostart: true,
			autoclear: true,
			stopOnFirstError: false,

			setInfo: {
				progress: function(value) {},
				name: function(text) {},
				status: function(text) {}
			},
			genInfo: {
				status: function(progress, finished) {
					if (finished) {
						return STATUSES['FINISHED'];
					}
					if (progress == 0) {
						return STATUSES['STARTED'];
					}
					else if (progress == 1) {
						return STATUSES['LOADED'];
					}
					else {
						return STATUSES['PROGRESS'];
					}
				},
				name: function(file, number, total) {
					return file + "(" + (number+1) + " из " + total + ")";
				},
				progress: function(loaded, total) {
					return loaded / total;
				}
			}
		}, options);
	
		function upload() {
			var files = this.files;
			var total = files.length;
			var $this = $(this);
			this.disabled = true;
			$this.trigger('html5_upload.onStart', total);
			var uploaded = 0;
			var xhr = this.html5_upload['xhr'];
			this.html5_upload['continue_after_abort'] = true;
			function upload_file(number) {
				if (number == total) {
					$this.trigger('html5_upload.onFinish', [total]);
					options.setInfo.status(options.genInfo.status(1, true));
			        $this.attr("disabled", false);
			        if (options.autoclear) {
			        	$this.val("");
			        }
			        return;
				}
				var file = files[number];
				$this.trigger('html5_upload.onStartOne', [file.fileName, number, total]);
				options.setInfo.status(options.genInfo.status(0));
				options.setInfo.name(options.genInfo.name(file.fileName, number, total));
				options.setInfo.progress(options.genInfo.progress(0, file.fileSize));
		        xhr.upload['onprogress'] = function(rpe) {
		        	$this.trigger('html5_upload.onProgress', [rpe.loaded / rpe.total, file.fileName, number, total]);
		        	options.setInfo.status(options.genInfo.status(rpe.loaded / rpe.total));
		        	options.setInfo.progress(options.genInfo.progress(rpe.loaded, rpe.total));
		        };
		        xhr.onload = function(load) {
		        	$this.trigger('html5_upload.onFinishOne', [xhr.responseText, file.fileName, number, total]);
		        	options.setInfo.status(options.genInfo.status(1, true));
		        	options.setInfo.progress(options.genInfo.progress(file.fileSize, file.fileSize));
			        upload_file(number+1);
		        };
		        xhr.onabort = function() {
		        	if ($this[0].html5_upload['continue_after_abort']) {
		        		upload_file(number+1);
		        	}
		        	else {
		        		$this.attr("disabled", false);
		        		if (options.autoclear) {
				        	$this.val("");
				        }
		        	}
		        };
		        xhr.onerror = function(e) {
		        	$this.trigger('html5_upload.onError', [file.fileName, e]);
		        	if (!options.stopOnFirstError) {
		        		upload_file(number+1);
		        	}
		        };
		        xhr.open("post", options.url, true);
		        xhr.setRequestHeader("Cache-Control", "no-cache");
		        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		        xhr.setRequestHeader("X-File-Name", file.fileName);
		        xhr.setRequestHeader("X-File-Size", file.fileSize);
		        xhr.setRequestHeader("Content-Type", "multipart/form-data");
		        xhr.send(file);
			}
			upload_file(0);
			return true;
		}

		return this.each(function() {
			this.html5_upload = {
				xhr:					new XMLHttpRequest(),
				continue_after_abort:	true
			};
			if (options.autostart) {
				$(this).bind('change', upload);
			}
			for (event in options.events) {
				$(this).bind("html5_upload."+event, options.events[event]);
			}
			$(this)
				.bind('html5_upload.start', upload)
				.bind('html5_upload.cancelOne', function() {
					this.html5_upload['xhr'].abort();
				})
				.bind('html5_upload.cancelAll', function() {
					this.html5_upload['continue_after_abort'] = false;
					this.html5_upload['xhr'].abort();
				})
				.bind('html5_upload.destroy', function() {
					delete this.html5_upload;
					$(this).unbind('html5_upload.*');
				});
		});
	};
})(jQuery);
