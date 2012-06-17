# jquery-html5-upload

HTML5 allows attribute multiple in input tag. It is possible to select multiple files in one dialog without flash.
With this plugin, you can easy upload multiple files and display progress of uploading.
Works in modern versions of Firefox and WebKit browsers.
Wasn't tested in IE.

This plugin is very simple. I think, everything is clean from it's source. But if you want to have a list of it's options - they are presented below.

## Options

### Events

All events except "change" used by plugin have prefix "html5_upload.".

#### Events used by plugin

It is not recommended to set handlers for this events manual.

**start**
Start upload selected files

**cancelOne**
Cancel upload of currently uploading file

**cancelAll**
Cancel current uploading

**destroy**
Removes traces of plugin work

#### On* events

This events can be set by passing it to plugin constructor.
When presented, 
**name** if the current file **name**,
**number** is the number of current file,
**total** is count of currenly selected files.

`onStart(event, total)`
Called when starting upload files.

`onStartOne(event, name, number, total)`
Called when a file begins uploading.

`onProgress(event, progress, name, number, total)`
Called when a `progress` part of file (0 <= `progress` <= 1) was uploaded.

`onFinishOne(event, response, name, number, total)`
Called when one file was uploaded. `response` is the server response.

`onFinish(event, total)`
Called when all files was uploaded.

`onError(event, name, error)`
(not fully implemented yet)
Called when XMLHttpRequest has an error.

### gen* and set* options

Sometimes you need no full control on all plugin events. If so, you can pass the gen* and set* functions to automatically set messages.

#### gen* functions

By default, they use STATUSES option to generate the text.

`genName(file, number, total)`

`genStatus(progress, finished)`
**progress** is a fraction. **finished** is true if file uploaded and response otained.

`genProgress(loaded, total)`
**loaded** is count of bytes of current file which currently loaded, **total** is current file size.

#### set* function

This functions get plain text from **set*** functions

`setName(text)`

`setStatus(text)`

`setProgress(text)`

### Other options

**autostart** (bool) start when the input value is changed

**autoclear** (bool) clear the input value when all files are uploaded

**stopOnFirstError** (bool) cancel uploading remaining files if an error occurred

**url** (string|function) url where send files, or function which will return it

**sendBoundary** (bool) format headers to emulate usual form file sending.

**fieldName** (string|function) if setBoundary is true, value for file field name

**extraFields** (map|function) extra fields to send with file upload
request (works only for HTML5)
