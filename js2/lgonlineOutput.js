﻿/*global define,dojo,js,window,touchScroll */
/*jslint sloppy:true */
/*
 | Copyright 2012 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define("js/lgonlineOutput", ["dojo/dom-construct", "js/lgonlineBase"], function (domConstruct) {

    //========================================================================================================================//

    dojo.declare("js.LGBusy", js.LGGraphic, {
        /**
         * Constructs an LGBusy.
         *
         * @constructor
         * @class
         * @name js.LGBusy
         * @extends js.LGGraphic
         * @classdesc
         * Manages the app's busy indicator.
         */
        constructor: function () {
            if (this.busyImageClass) {
                dojo.addClass(this.rootDiv, this.busyImageClass);

            }
        }
    });

    //========================================================================================================================//

    dojo.declare("js.LGLogBox", js.LGDropdownBox, {
        /**
         * Constructs an LGLogBox.
         *
         * @see Sets the global variable window.gLogMessageBox to point to
         *       this object.
         *
         * @constructor
         * @class
         * @name js.LGLogBox
         * @extends js.LGGraphic
         * @classdesc
         * Provides a UI display of log messages to supplement the
         * console.
         */
        constructor: function () {
            window.gLogMessageBox = this;
            touchScroll(this.rootDiv);
        },

        /**
         * Appends content to the root div.
         * @param {string|object} newContent A string that forms the
         *        innerHTML of a new div that's appended to the root div
         *        or an object that's appended to the root div
         * @memberOf js.LGLogBox#
         */
        append: function (newContent) {
            if (typeof newContent === "string") {
                domConstruct.create("div", {innerHTML: newContent, style: "margin:2px"}, this.rootDiv);

            } else if (typeof newContent === "object" && newContent !== null) {
                this.rootDiv.appendChild(newContent);
            }
        }
    });

    //========================================================================================================================//

    dojo.declare("js.LGMessageBox", js.LGDropdownBox, {
        /**
         * Constructs an LGMessageBox.
         *
         * @param {string} content HTML to insert into box
         *
         * @constructor
         * @class
         * @name js.LGMessageBox
         * @extends js.LGDropdownBox
         * @classdesc
         * Provides a UI display of a chunk of HTML.
         */
        constructor: function () {
            if (this.content && this.content.length > 0) {
                this.rootDiv.innerHTML = this.content;
            }
            touchScroll(this.rootDiv);
        }
    });

    //========================================================================================================================//

    dojo.declare("js.LGPublishEcho", js.LGDropdownBox, {
        /**
         * Constructs an LGPublishEcho.
         *
         * @class
         * @name js.LGPublishEcho
         * @extends js.LGDropdownBox
         * @classdesc
         * Provides a UI display of a published message.
         */

        /**
         * Handles a trigger by toggling visibility and displaying the
         * trigger's data.
         * @param {object} [data] Data accompanying trigger.
         * @memberOf js.LGPublishEcho#
         * @override
         */
        handleTrigger: function (data) {
            this.rootDiv.innerHTML = data.toString();
            this.toggleVisibility();
        }
    });

    //========================================================================================================================//

});
