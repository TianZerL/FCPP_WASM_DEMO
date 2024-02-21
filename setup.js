var Module = {};

function main() {
    var statusElement = document.getElementById('status');
    var progressElement = document.getElementById('progress');
    var spinnerElement = document.getElementById('spinner');

    Module = {
        onRuntimeInitialized: () => {
            Module.print(Module.info());
        },
        print: (() => {
            var element = document.getElementById('output');
            if (element) element.value = ''; // clear browser cache
            return (...args) => {
                var text = args.join(' ');
                // These replacements are necessary if you render to raw HTML
                //text = text.replace(/&/g, '&amp;');
                //text = text.replace(/</g, '&lt;');
                //text = text.replace(/>/g, '&gt;');
                //text = text.replace('\n', '<br>', 'g');
                console.log(text);
                if (element) {
                    element.value += text + '\n';
                    element.scrollTop = element.scrollHeight; // focus on bottom
                }
            };
        })(),
        canvas: (() => {
            var canvas = document.getElementById('canvas');

            // As a default initial behavior, pop up an alert when webgl context is lost. To make your
            // application robust, you may want to override this behavior before shipping!
            // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
            canvas.addEventListener('webglcontextlost', e => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

            return canvas;
        })(),
        setStatus: (text) => {
            if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
            if (text === Module.setStatus.last.text) return;
            var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            var now = Date.now();
            if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
            Module.setStatus.last.time = now;
            Module.setStatus.last.text = text;
            if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2]) * 100;
                progressElement.max = parseInt(m[4]) * 100;
                progressElement.hidden = false;
                spinnerElement.hidden = false;
            } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
                if (!text) spinnerElement.hidden = true;
            }
            statusElement.innerHTML = text;
        },
        totalDependencies: 0,
        monitorRunDependencies: (left) => {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
        }
    };

    Module.setStatus('Downloading...');
    window.onerror = () => {
        Module.setStatus('Exception thrown, see JavaScript console');
        spinnerElement.style.display = 'none';
        Module.setStatus = (text) => {
            if (text) console.error('[post-exception status] ' + text);
        };
    };

    var romList = []

    function addNameToRomList(name) {
        if (romList.includes(name)) return;
        var romListElement = document.getElementById('romList');
        var option = document.createElement('option');
        option.text = name;
        option.value = name;
        romListElement.add(option);
        romListElement.value = name;
        romList.push(name);
    }

    function loadRom(rom) {
        if (rom) {
            console.log('upload:' + rom.name);
            var reader = new FileReader();
            reader.onload = e => {
                FS.writeFile(rom.name, new Uint8Array(e.target.result));
                addNameToRomList(rom.name);
                start(rom.name);
            };
            reader.readAsArrayBuffer(rom);
        }
    }

    function start(name) {
        try {
            Module.stop();
            Module.start(name);
        } catch (e) { }
    }

    document.getElementById('romList').addEventListener('change', e => {
        var option = e.target.options[e.target.selectedIndex];
        var rom = {
            name: option.text,
            path: option.value
        };
        if (romList.includes(rom.name)) start(rom.name);
        else {
            Module.setStatus('Downloading...');
            fetch(rom.path).then(res => {
                if (!res.ok) Module.setStatus('Failed to download');
                return res.arrayBuffer();
            }).then(data => {
                Module.setStatus('');
                const filename = rom.path.substr(rom.path.lastIndexOf('/') + 1);
                console.log('downloaded: ' + filename);
                FS.writeFile(filename, new Uint8Array(data));
                romList.push(filename);
                start(filename);
            })
        }
    })
    document.getElementById('uploadROM').addEventListener('change', e => {
        loadRom(e.target.files[0]);
    })
    document.addEventListener('dragenter', e => {
        e.preventDefault();
        e.stopPropagation();
    })
    document.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
    })
    document.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();

        loadRom(e.dataTransfer.files[0]);
    })
}

if (!('WebAssembly' in window)) {
    document.body.innerHTML = '<h1>This browser does not support WebAssembly.</h1>';
} else {
    main();
}
