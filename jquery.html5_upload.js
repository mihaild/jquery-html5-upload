/*globals jQuery, alert, window, FormData, XMLHttpRequest */
(function ($) {
    'use strict';
    jQuery.fn.html5_upload = function (options) {
        var available_events = ['onStart', 'onStartOne', 'onProgress', 'onFinishOne', 'onFinish', 'onError'];

        function get_file_name(file) {
            return file.name || file.fileName;
        }

        function get_file_size(file) {
            return file.size || file.fileSize;
        }

        options = jQuery.extend({
            onStart: function (event, total) {
                return true;
            },
            onStartOne: function (event, name, number, total) {
                return true;
            },
            onProgress: function (event, progress, name, number, total) {
            },
            onFinishOne: function (event, response, name, number, total) {
            },
            onFinish: function (event, total) {
            },
            onError: function (event, name, error) {
            },
            onBrowserIncompatible: function () {
                alert('Sorry, but your browser is incompatible with uploading files using HTML5 (at least, with current preferences.\n Please install the latest version of Firefox, Safari or Chrome');
            },
            autostart: true,
            autoclear: true,
            stopOnFirstError: false,
            sendBoundary: false,
            fieldName: 'user_file[]', //ignore if sendBoundary is false
            method: 'post',
            mimeTypes: false,

            STATUSES: {
                'STARTED'   : 'Started',
                'PROGRESS'  : 'Progress',
                'LOADED'    : 'Loaded',
                'FINISHED'  : 'Finished'
            },
            headers: {
                'Cache-Control' : 'no-cache',
                'X-Requested-With' : 'XMLHttpRequest',
                'X-File-Name': function (file) { return get_file_name(file); },
                'X-File-Size': function (file) { return get_file_size(file); },
                'Content-Type': function (file) {
                    if (!options.sendBoundary) { return 'multipart/form-data'; }
                    return false;
                }
            },


            setName: function (text) {},
            setStatus: function (text) {},
            setProgress: function (value) {},

            genName: function (file, number, total) {
                return file + '(' + (number + 1) + ' из ' + total + ')';
            },
            genStatus: function (progress, finished) {
                if (finished) {
                    return options.STATUSES.FINISHED;
                }

                if (progress === 0) {
                    return options.STATUSESSTARTED;
                }

                if (progress === 1) {
                    return options.STATUSES.LOADED;
                }

                return options.STATUSES.PROGRESS;
            },
            genProgress: function (loaded, total) {
                return loaded / total;
            }
        }, options);

        function upload() {
            var files = this.files,
                total = files.length,
                $this = $(this),
                uploaded,
                xhr;

            if (!$this.triggerHandler('html5_upload.onStart', [total])) {
                return false;
            }

            this.disabled = true;
            uploaded = 0;
            xhr = this.html5_upload.xhr;
            this.html5_upload.continue_after_abort = true;

            function finish(total) {
                $this.triggerHandler('html5_upload.onFinish', [total]);
                options.setStatus(options.genStatus(1, true));
                $this.attr('disabled', false);

                if (options.autoclear) {
                    $this.val('');
                }
            }

            function upload_file(number) {
                var file = files[number],
                    boundary,
                    dashdash,
                    crlf,
                    builder,
                    fileName,
                    formData;

                if (number === total) {
                    finish(total);
                    return;
                }

                if (options.mimeTypes && options.mimeTypes.indexOf(file.type) === -1) {
                    /**
                     * I don't think it's the right error event.
                     * It's described as follow:
                     * onError(event, name, error) (not fully implemented yet)
                     * Called when XMLHttpRequest has an error.
                     */
                    $this.triggerHandler('html5_upload.onError');
                    if (!options.stopOnFirstError) {
                        number += 1;

                        if (number === total) { //dirty way to jump off the loop.
                            finish(total);
                            return;
                        }

                        upload_file(number);
                    }
                }

                if (!$this.triggerHandler('html5_upload.onStartOne', [get_file_name(file), number, total])) {
                    return upload_file(number + 1);
                }

                options.setStatus(options.genStatus(0));
                options.setName(options.genName(get_file_name(file), number, total));
                options.setProgress(options.genProgress(0, get_file_size(file)));

                xhr.upload.onprogress = function (rpe) {
                    $this.triggerHandler('html5_upload.onProgress', [rpe.loaded / rpe.total, get_file_name(file), number, total]);
                    options.setStatus(options.genStatus(rpe.loaded / rpe.total));
                    options.setProgress(options.genProgress(rpe.loaded, rpe.total));
                };

                xhr.onload = function (load) {
                    if (xhr.status !== 200) {
                        $this.triggerHandler('html5_upload.onError', [get_file_name(file), load]);
                        if (!options.stopOnFirstError) {
                            upload_file(number + 1);
                        }
                    } else {
                        $this.triggerHandler('html5_upload.onFinishOne', [xhr.responseText, get_file_name(file), number, total]);
                        options.setStatus(options.genStatus(1, true));
                        options.setProgress(options.genProgress(get_file_size(file), get_file_size(file)));
                        upload_file(number + 1);
                    }
                };

                xhr.onabort = function () {
                    if ($this[0].html5_upload.continue_after_abort) {
                        upload_file(number + 1);
                    } else {
                        $this.attr('disabled', false);
                        if (options.autoclear) {
                            $this.val('');
                        }
                    }
                };

                xhr.onerror = function (e) {
                    $this.triggerHandler('html5_upload.onError', [get_file_name(file), e]);
                    if (!options.stopOnFirstError) {
                        upload_file(number + 1);
                    }
                };

                xhr.open(options.method, typeof (options.url) === 'function' ? options.url(number) : options.url, true);
                $.each(options.headers, function (key, val) {
                    val = typeof (val) === 'function' ? val(file) : val; // resolve value
                    if (val === false) { return true; } // if resolved value is boolean false, do not send this header
                    xhr.setRequestHeader(key, val);
                });

                if (!options.sendBoundary) {
                    xhr.send(file);
                } else {
                    if (window.FormData) {//Many thanks to scottt.tw
                        formData = new FormData();
                        formData.append(typeof (options.fieldName) === 'function' ? options.fieldName() : options.fieldName, file);
                        xhr.send(formData);
                    } else if (file.getAsBinary) { //Thanks to jm.schelcher
                        boundary = '------multipartformboundary' + (new Date().getTime());
                        dashdash = '--';
                        crlf     = '\r\n';

                        /* Build RFC2388 string. */
                        builder = '';

                        builder += dashdash;
                        builder += boundary;
                        builder += crlf;

                        builder += 'Content-Disposition: form-data; name="' + (typeof (options.fieldName) === 'function' ? options.fieldName() : options.fieldName) + '"';

                        //thanks to oyejo...@gmail.com for this fix
                        /**
                         * unescape is deprecated. Replaced with decodeURI
                         * (http://developer.mozilla.org/en/JavaScript/Reference/Deprecated_and_obsolete_features)
                         */
                        fileName = decodeURI(encodeURIComponent(get_file_name(file))); //encode_utf8

                        builder += '; filename="' + fileName + '"';
                        builder += crlf;

                        builder += 'Content-Type: application/octet-stream';
                        builder += crlf;
                        builder += crlf;

                        /* Append binary data. */
                        builder += file.getAsBinary();
                        builder += crlf;

                        /* Write boundary. */
                        builder += dashdash;
                        builder += boundary;
                        builder += dashdash;
                        builder += crlf;

                        xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
                        xhr.sendAsBinary(builder);
                    } else {
                        options.onBrowserIncompatible();
                    }
                }
            }
            upload_file(0);
            return true;
        }

        return this.each(function () {
            var event;

            this.html5_upload = {
                xhr: new XMLHttpRequest(),
                continue_after_abort: true
            };
            if (options.autostart) {
                $(this).on('change', upload);
            }
            for (event in available_events) {
                if (available_events.hasOwnProperty(event)) {
                    if (options[available_events[event]]) {
                        $(this).on('html5_upload.' + available_events[event], options[available_events[event]]);
                    }
                }
            }
            $(this)
                .on('html5_upload.start', upload)
                .on('html5_upload.cancelOne', function () {
                    this.html5_upload.xhr.abort();
                })
                .on('html5_upload.cancelAll', function () {
                    this.html5_upload.continue_after_abort = false;
                    this.html5_upload.xhr.abort();
                })
                .on('html5_upload.destroy', function () {
                    this.html5_upload.continue_after_abort = false;
                    this.xhr.abort();
                    delete this.html5_upload;
                    $(this).off('html5_upload.*').off('change', upload);
                });
        });
    };
}(jQuery));
