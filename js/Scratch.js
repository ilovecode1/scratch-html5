// Copyright (C) 2013 Massachusetts Institute of Technology
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 2,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

// Scratch HTML5 Player
// Scratch.js
// Tim Mickel, July 2011

// Here we define the actions taken on window load.
// The three application-wide global variables are defined here.

'use strict';

var runtime, interp, io, iosAudioActive = false;
function Scratch(projectIdOrFile) {
    runtime = new Runtime();
    runtime.init();

    $(window).keydown(function(e) {
        runtime.keysDown[e.which] = true;
        runtime.startKeyHats(e.which);
        if (e.target==document.body) {
            e.preventDefault();
        }
    });

    $(window).keyup(function(e) {
        delete runtime.keysDown[e.which];
    });

    var project_id;
    var address = $('#address-hint');
    var project = $('#project-id');

    // Update the project ID field
    if (typeof projectIdOrFile === 'number') {
         project_id = projectIdOrFile;
 
         // Update the project ID field
         project.val(project_id);
     } else {
         project.val(sessionStorage.getItem('filename'));
     }

    // Validate project ID field
    project.keyup(function(evnt) {
        var n = this.value;

        // Allow URL pasting
        var e = /projects\/(\d+)/.exec(n);
        if (e) {
            n = this.value = e[1];
        }
        
        // Load a .sb2 file locally
     $("#file-picker").on('change', function (evnt) {
         var fileObj = event.target.files[0];
         var reader = new FileReader();
         reader.onload = function (load_event) {
             sessionStorage.setItem('filename', fileObj.name);
             sessionStorage.setItem('file-contents', load_event.target.result);
             window.location = '#file';
             window.location.reload(true);
         };
         reader.readAsBinaryString(fileObj);
     });

        // Eventually, this will xhr to /projects/{{this.value}}/ and
        // change color based on whether the response is 404 or 200.
        if (isNaN(n)) {
             $('#project-id, #address-hint').toggleClass('error', true);
         } else if (evnt.keyCode === 13) {
             // simulate click on #go-project
             $('#go-project').click();
         }
    });

    // Focus the actual input when the user clicks on the URL hint
    address.click(function() {
        project.select();
    });

    var width = address.outerWidth();
    project.css({
        paddingLeft: width,
        marginLeft: -width
    });

    // Go project button behavior
    $('#go-project').click(function() {
        window.location = '#' + parseInt($('#project-id').val());
        window.location.reload(true);
    });

    // Green flag behavior
    $('#trigger-green-flag, #overlay').click(function() {
        if (!runtime.projectLoaded) return;
        $('#overlay').css('display', 'none');
        runtime.greenFlag()
    });

    // Stop button behavior
    $('#trigger-stop').click(function() {
        runtime.stopAll();
    });

    // Canvas container mouse events
    $('#container').mousedown(function(e) {
        runtime.mouseDown = true;
        //e.preventDefault();
    });

    $('#container').mouseup(function(e) {
        runtime.mouseDown = false;
        //e.preventDefault();
    });

    $('#container').mousemove(function(e) {
        var bb = this.getBoundingClientRect();
        var absX = e.clientX - bb.left;
        var absY = e.clientY - bb.top;
        runtime.mousePos = [absX-240, -absY+180];
    });

    // Touch events - EXPERIMENTAL
    $(window).bind('touchstart', function(e) {
        // On iOS, we need to activate the Web Audio API
        // with an empty sound play on the first touch event.
        if (!iosAudioActive) {
            var ibuffer = runtime.audioContext.createBuffer(1, 1, 22050);
            var isource = runtime.audioContext.createBufferSource();
            isource.buffer = ibuffer;
            isource.connect(runtime.audioContext.destination);
            isource.start();
            iosAudioActive = true;
        }
    });

    $('#container').bind('touchstart', function(e) {
        runtime.mouseDown = true;
    });

    $('#container').bind('touchend', function(e) {
        runtime.mouseDown = true;
    });

    $('#container').bind('touchmove', function(e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        var bb = this.getBoundingClientRect();
        var absX = touch.clientX - bb.left;
        var absY = touch.clientY - bb.top;
        runtime.mousePos = [absX-240, -absY+180];
    });

    // Border touch events - EXPERIMENTAL
    $('#left').bind('touchstart touchmove', function(e) { runtime.keysDown[37] = true; runtime.startKeyHats(37); });
    $('#left').bind('touchend', function(e) { delete runtime.keysDown[37]; });
    $('#up').bind('touchstart touchmove', function(e) { runtime.keysDown[38] = true; runtime.startKeyHats(38); });
    $('#up').bind('touchend', function(e) { delete runtime.keysDown[38]; });
    $('#right').bind('touchstart touchmove', function(e) { runtime.keysDown[39] = true; runtime.startKeyHats(39); });
    $('#right').bind('touchend', function(e) { delete runtime.keysDown[39]; });
    $('#down').bind('touchstart touchmove', function(e) { runtime.keysDown[40] = true; runtime.startKeyHats(40); });
    $('#down').bind('touchend', function(e) { delete runtime.keysDown[40]; });

    // Load the interpreter and primitives
    interp = new Interpreter();
    interp.initPrims();

    // Load the requested project and go!
    io = new IO();
    if (project_id) {
         io.loadProject(project_id);
     } else {
         console.log('loading', sessionStorage.getItem('filename'));
         io.loadProjectFromFile(sessionStorage.getItem('file-contents'));
     }
};
