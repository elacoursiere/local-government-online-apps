﻿/*global define,dojo,js,window,document,console */
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
define("js/lgonlineBase", ["dojo/dom-construct", "dojo/dom-style", "dojo/dom-class", "dojo/_base/array", "dojo/topic"], function (domConstruct, domStyle, domClass, array, topic) {

    //========================================================================================================================//

    dojo.declare("js.LGObject", null, {
        /**
         * Constructs an LGObject.
         *
         * @param {object} [args.parentDiv] Name of DOM
         *        object into which the object's div is to be placed;
         *        required for subsequent searching for this object by
         *        id
         * @param {string} args.rootId Id for root div of created object
         * @param {string} [args.rootClass] Name of CSS class to
         *        use for the root container of the object; if omitted,
         *        the div's style is set to "display:none"
         *
         * @constructor
         * @class
         * @name js.LGObject
         * @classdesc
         * Provides a base class for LG objects; includes utility
         * functions.
         */
        constructor: function (args) {
            var rootAttrs, parentDiv, parentDivObj, pThis = this;

            if (undefined !== args) {  // Guard needed by IE7, IE8
                dojo.safeMixin(this, args);
            }

            // Check for prerequisites before continuing
            if (this.checkPrerequisites) {
                // Throws exception if prerequisites not met
                this.checkPrerequisites();
            }

            // Construct the root container
            rootAttrs = {};
            if (this.rootId) {
                rootAttrs.id = this.rootId;
            }
            if (this.rootClass) {
                rootAttrs.className = this.rootClass;
            } else {
                rootAttrs.style = "display:none";
            }

            // If a parent div is supplied, make sure that it exists
            if (this.parentDiv !== undefined) {
                parentDiv = this.parentDiv;
                parentDivObj = dojo.byId(parentDiv);
                if (!parentDivObj) {
                    parentDiv = null;
                }
            } else {
                parentDiv = null;
            }

            /**
             * The root div container for the object.
             * @member {div} rootDiv
             * @private
             * @memberOf js.LGObject#
             */
            if (parentDivObj && parentDivObj.getLGObject && parentDivObj.getLGObject().addItem) {
                this.rootDiv = domConstruct.create("div", rootAttrs);
                parentDivObj.getLGObject().addItem(this.rootDiv);
            } else {
                this.rootDiv = domConstruct.create("div", rootAttrs, parentDiv);
            }

            /**
             * This object--the one associated with the root div container.
             * @return {object} The LG object
             * @memberOf js.LGObject#
             */
            this.rootDiv.getLGObject = function () {
                return pThis;
            };
        },

        /**
         * Returns the root div of the object.
         * @return {object} The root div container
         * @memberOf js.LGObject#
         */
        getRootDiv: function () {
            return this.rootDiv;
        },

        /**
         * Deletes the item's associated div from the DOM.
         * @memberOf js.LGObject#
         */
        deleteDivFromDom: function () {
            if (this.rootDiv) {
                this.rootDiv.parentNode.removeChild(this.rootDiv);
            }
        },

        /**
         * Injects a string of CSS into the document.
         * @example
         * <pre>
         * // For <div class="titleBox"><div class="title">Title</div></div>
         * require(["dojo/ready", "js/lgonlineBase"], function (ready) {
         *     ready(function () {
         *         var loader = new js.LGObject();
         *         loader.injectCSS(
         *             ".titleBox{width:100%;height:52px;margin:0px;padding:4px;color:white;background-color:#1e90ff;text-align:center;overflow:hidden;}"+
         *             ".title{font-size:24px;position:relative;top:25%}"
         *         );
         *     });
         * });
         * </pre>
         * @param {string} cssStr A string of CSS text
         * @return {object} DOM style element
         * @memberOf js.LGObject#
         */
        injectCSS: function (cssStr) {
            var customStyles, cssText, firstScript;

            // By Fredrik Johansson
            // http://www.quirksmode.org/bugreports/archives/2006/01/IE_wont_allow_documentcreateElementstyle.html#c4088
            customStyles = document.createElement("style");
            customStyles.setAttribute("type", "text/css");
            if (customStyles.styleSheet) {  // IE 7 & 8
                customStyles.styleSheet.cssText = cssStr;
            } else {  // W3C
                cssText = document.createTextNode(cssStr);
                customStyles.appendChild(cssText);
            }

            // http://paulirish.com/2011/surefire-dom-element-insertion/
            firstScript = document.getElementsByTagName("script")[0];
            firstScript.parentNode.insertBefore(customStyles, firstScript);

            return customStyles;
        },

        /**
         * Converts a string into a value retrieved from the object's
         * i18n structure if the string begins with "@" or from an
         * object by its id if the string begins with ".".
         * @param {string} aString A string or "@" followed by a path
         *        into the object's i18n structure or "." followed by an
         *        object id and an optional path into the object
         * @return {string} Original string if it doesn't begin with
         *        "@" or "." or the item found at the end of the
         *        original string interpreted as a path
         * @memberOf js.LGObject#
         */
        checkForSubstitution: function (aString) {
            var leadChar, resolvedString = aString;

            if (aString && aString.length > 1) {
                leadChar = aString.substring(0, 1);  // IE7/8 cannot use aString[0]
                if ("@" === leadChar) {
                    if (this.i18n) {
                        resolvedString = this.followAttributePath(this.i18n, aString.substring(1));
                    }
                } else if ("." === leadChar) {
                    resolvedString = this.followAttributePath(null, aString.substring(1));
                }
            }

            return resolvedString;
        },

        /**
         * Follows a path of attributes into an object.
         * @param {object} rootObj Object into which we'll look
         * @param {string} attributePath Path of attributes into
         *        rootObj; e.g., if the attribute path is
         *        "tooltips.share", then this routine returns
         *        rootObj.tooltips.share
         * @return {object} Object at end of attribute path
         * @memberOf js.LGObject#
         */
        followAttributePath: function (rootObj, attributePath) {
            var x, objAtEnd = rootObj, attributeChain;

            // Step thru the chain of nested attributes to get to the object at the end
            try {
                attributeChain = attributePath.split(".");
                for (x = 0; x < attributeChain.length; x = x + 1) {
                    if (null === objAtEnd) {
                        objAtEnd = dojo.byId(attributeChain[x]).getLGObject();
                    } else {
                        objAtEnd = objAtEnd[attributeChain[x]];
                    }
                }
            } catch (ex) {
                objAtEnd = null;
            }

            return objAtEnd;
        },

        /**
         * Displays a message to the console, and, optionally, also
         * publishes it. If window.gLogMessageBox is defined, message is also
         * appended to it.
         * @param {string} message Message to write
         * @param {boolean} publishError If true, message is also
         *        published under the topic "error"
         * @memberOf js.LGObject#
         */
        log: function (message, publishError) {
            if (console) {
                console.log(message);
            }
            if (publishError) {
                topic.publish("error", message);
            }
            if (window.gLogMessageBox) {
                window.gLogMessageBox.append(message);
            }
        }

    });

    //========================================================================================================================//

    dojo.declare("js.LGGraphic", js.LGObject, {
        /**
         * Constructs an LGGraphic.
         *
         * @param {object} [args.parentDiv] Name of DOM
         *        object into which the object's div is to be placed;
         *        required for subsequent searching for this object by
         *        id (LGObject)
         * @param {string} args.rootId Id for root div of created object
         *        (LGObject)
         * @param {boolean} [args.fill=false] Whether the object should
         *        fill its parent's div or not; if fill is true, the
         *        horizOffset and vertOffset parameters are ignored
         * @param {number} [args.horizOffset] Horizontal offset
         *        flag/value: >0: left side; 0: center; <0: right side;
         *        undefined: no horizontal or vertical adjustment;
         *        requires absolute positioning
         * @param {number} [args.vertOffset] Vertical offset
         *        flag/value: >0: top side; 0: center; <0: bottom side;
         *        undefined: no horizontal or vertical adjustment;
         *        requires absolute positioning
         *
         * @param {object} [args.values] Key-value pairs for
         *        configurable elements
         *
         * @param {object} [args.i18n] Key-value pairs for text
         *        strings for non-configurable elements
         *
         * @constructor
         * @class
         * @name js.LGGraphic
         * @extends js.LGObject
         * @classdesc
         * Provides a base class for LG objects that are meant to be
         * displayed.
         */
        constructor: function () {
            // Do class-specific adjustments whenever the window is resized
            dojo.connect(window, "resize", this, this.handleWindowResize, true);
            this.handleWindowResize();
        },

        /**
         * Shows or hides the graphic.
         * @param {boolean} isVisible Indicates if graphic should be
         *        shown (true) or hidden
         * @memberOf js.LGGraphic#
         */
        setIsVisible: function (isVisible) {
            domStyle.set(this.getRootDiv(), "display", isVisible ? "block" : "none");
        },

        /**
         * Toggles the graphic's visibility
         * @memberOf js.LGGraphic#
         */
        toggleVisibility: function () {
            var isVisibleNow = domStyle.get(this.getRootDiv(), "display") !== "none";
            domStyle.set(this.getRootDiv(), "display", isVisibleNow ? "none" : "block");
        },

        /**
         * Handles a resize event and repositions the object as needed.
         * @memberOf js.LGGraphic#
         */
        handleWindowResize: function () {
            // Fill object in its parent
            if (this.fill !== undefined && this.fill === true) {
                this.fillParentDiv();
            // Align object over its parent
            } else if (this.horizOffset !== undefined && this.vertOffset !== undefined) {
                this.alignOver(this.rootDiv, this.rootDiv.parentNode,
                    this.horizOffset, this.vertOffset);
            }
        },

        /**
         * Adjusts height and width of object to fill parent div.
         * @memberOf js.LGGraphic#
         */
        fillParentDiv: function () {
            var styleAttrs;

            if (this.rootDiv.parentNode) {
                // Note: margin != 0 shifts item, although it has the dimensions of its parent
                styleAttrs = {
                    left: "0px",
                    top: "0px",
                    width: this.rootDiv.parentNode.clientWidth + "px",
                    height: this.rootDiv.parentNode.clientHeight + "px"
                };
                dojo.style(this.rootDiv, styleAttrs);
            }
        },

        /**
         * Aligns an absolutely-positioned div over another div.
         * @param {string|object} overDiv Div to be positioned; it needs
         *        to be styled "position:absolute" and left, right, top,
         *        and bottom cannot be set
         * @param {string|object} underDiv Div over which overDiv is to
         *        be positioned
         * @param {number|array} horizOffset Horizontal pixel offset of
         *        overDiv: >0 pixels from left side; 0 is center; <0
         *        pixels from right side; array applies offsets in
         *        order, so with [2,0], the div is horizontally
         *        centered, but with [2,-3], the div is positioned 2
         *        pixels from the left side and 3 pixels from the right
         *        side
         * @param {number|array} vertOffset Vertical pixel offset of
         *        overDiv: >0 pixels from top side; 0 is center; <0
         *        pixels from bottom side; array applies offsets in
         *        order (see horizOffset param)
         * @memberOf js.LGGraphic#
         */
        alignOver: function (overDiv, underDiv, horizOffset, vertOffset) {
            var overDivBox, underDivBox, styleAttrs, pThis = this;

            // Shield the modifications--we may be missing a parent
            if (overDiv && underDiv) {
                // Inspired by the Dojo reference guide
                // http://dojotoolkit.org/reference-guide/1.7/dojo/position.html#center-a-dom-node-over-another
                overDivBox = dojo.marginBox(overDiv);
                underDivBox = dojo.marginBox(underDiv);

                styleAttrs = {};
                if (typeof horizOffset === "number") {
                    styleAttrs = this.insertHorizPositioningStyle(styleAttrs, horizOffset, overDivBox, underDivBox);
                } else if (typeof horizOffset === "object") {
                    array.forEach(horizOffset, function (horizOff) {
                        styleAttrs = pThis.insertHorizPositioningStyle(styleAttrs, horizOff, overDivBox, underDivBox);
                    });
                }
                if (typeof vertOffset === "number") {
                    styleAttrs = this.insertVertPositioningStyle(styleAttrs, vertOffset, overDivBox, underDivBox);
                } else if (typeof vertOffset === "object") {
                    array.forEach(vertOffset, function (vertOff) {
                        styleAttrs = pThis.insertVertPositioningStyle(styleAttrs, vertOff, overDivBox, underDivBox);
                    });
                }
                dojo.style(overDiv, styleAttrs);
            }
        },

        /**
         * Inserts horizontal style attributes into the supplied
         * structure.
         * @param {object} styleAttrs Structure to receive style
         *        attributes; attributes are overwritten if they already
         *        exist
         * @param {number} horizOffset Horizontal pixel offset of
         *        overDiv: >0 pixels from left side; 0 is center; <0
         *        pixels from right side
         * @param {object} overDivBox dojo.marginBox of div to be
         *        positioned
         * @param {object} underDivBox dojo.marginBox of div over which
         *        overDiv is to be positioned
         * @return {object} Updated styleAttrs structure
         * @memberOf js.LGGraphic#
         */
        insertHorizPositioningStyle: function (styleAttrs, horizOffset, overDivBox, underDivBox) {
            if (0 < horizOffset) {
                styleAttrs.left = horizOffset + "px";
            } else if (0 === horizOffset) {
                styleAttrs.left = Math.round((underDivBox.w - overDivBox.w) / 2) + "px";
            } else {
                styleAttrs.right = (-horizOffset) + "px";
            }
            return styleAttrs;
        },

        /**
         * Inserts vertical style attributes into the supplied
         * structure.
         * @param {object} styleAttrs Structure to receive style
         *        attributes; attributes are overwritten if they already
         *        exist
         * @param {number} vertOffset Vertical pixel offset of
         *        overDiv: >0 pixels from top side; 0 is center; <0
         *        pixels from bottom side
         * @param {object} overDivBox dojo.marginBox of div to be
         *        positioned
         * @param {object} underDivBox dojo.marginBox of div over which
         *        overDiv is to be positioned
         * @return {object} Updated styleAttrs structure
         * @memberOf js.LGGraphic#
         */
        insertVertPositioningStyle: function (styleAttrs, vertOffset, overDivBox, underDivBox) {
            if (0 < vertOffset) {
                styleAttrs.top = vertOffset + "px";
            } else if (0 === vertOffset) {
                styleAttrs.top = Math.round((underDivBox.h - overDivBox.h) / 2) + "px";
            } else {
                styleAttrs.bottom = (-vertOffset) + "px";
            }
            return styleAttrs;
        },

        /**
         * Applies the current theme class to the object.
         * @param {boolean} [withHover] Node has hover color or not; no
         *        hover color if omitted
         * @param {string|object} [node] Node to receive style; applied
         *        to the calling object if omitted
         * @memberOf js.LGGraphic#
         */
        applyTheme: function (withHover, node) {
            domClass.add(node || this.rootDiv, "appTheme");
            if (withHover) {
                domClass.add(node || this.rootDiv, "appThemeHover");
            }
        }

    });

    //========================================================================================================================//

    dojo.declare("js.LGDependency", null, {
        /**
         * Constructs an LGDependency.
         *
         * @constructor
         * @class
         * @name js.LGDependency
         * @extends js.LGGraphic
         * @classdesc
         * Provides a mixin for handling a ready dependency on another
         * object.
         */
        constructor: function () {
            var dependsOn, pThis = this;

            if (this.dependencyId) {
                dependsOn = dojo.byId(this.dependencyId).getLGObject();
                this.onDependencyPrep(dependsOn);
                dependsOn.ready.then(function () {
                    pThis.onDependencyReady();
                });
            }
        },

        /**
         * Performs class-specific setup before waiting for a
         * dependency.
         * @memberOf js.LGCommand#
         * @param {object} dependsOn LG object that this object depends
         *        on
         */
        onDependencyPrep: function () {
            return null;
        },

        /**
         * Performs class-specific setup when the dependency is
         * satisfied.
         * @memberOf js.LGCommand#
         */
        onDependencyReady: function () {
            return null;
        }
    });

    //========================================================================================================================//

});
