(function(window) {
    'use strict';

    var
        PX_PER_CM = 5,
        MOUSE_EVENTS = ['down', 'move', 'up', 'leave'],
        DEG_RAD = Math.PI / 180
    ;

    var Sticker = function(wrapper, width, height, supportImages, restoreUUID) {
        if (!(this instanceof Sticker)) return new (Function.prototype.bind.apply(Sticker, [null].concat(Array.prototype.slice.call(arguments))));

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        for (var i = 0, il = MOUSE_EVENTS.length; i < il; i++) {
            this.canvas.addEventListener('mouse' + MOUSE_EVENTS[i], this['onmouse' + MOUSE_EVENTS[i]].bind(this));
        }

        wrapper.appendChild(this.canvas);

        this.supportImages = !!supportImages;

        this.zoomRate = 1;

        this.gridSize = 50;
        this.gridLineWidth = 1;
        this.gridColor = 'rgba(100, 100, 100, 0.5)';
        this.bgColor = 'rgb(255, 255, 255)';

        this.transformImage = new Image();
        this.transformImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADTElEQVQ4T22TXWxTZRjH/+/56tauL6k4tu6jYzCgxM0oGAMK25KxOSqgJl6oaOKN8UqdU2ImF0tMjBfGiNwt3hj5vCBR+SiTsaRDFGIEjczQbYWxrlsZU5tzunbr6fnweQ/EK56rc3Le93ee5//8/+zWZCpz5fqd4I2b8zBtC7IkAQwPLxewHQearKBtcx22b1mbZ98eGy58f3HcD0lBU2QNfKqKsmURgIGx+yTXpZtwoSoKSuUyZtL3AMfCi7tai6z/4JB+K5Pnb7/Rg03RtZAkhjIdsm0XK6YAARWaAllmUAnuOC4mkncwdOQC1jcEDfbOgcP6klXB39zfi5mFPIpLJjRNolZdOux4AInGkglsmg78VRqaaoL45tgwqpQVg/V/fFjP5CS+J9aJxVwBNv19uWRjXSSEZ59o9AA//zGL2+kcKn0yZOqiOhTA2XgCDSGHAANf6RPzJo/1dtHYLozCMhbuFdC+NYKXuqMe4LuRJC5dS6NmTQA8UElyMMSHR7GpTjPY+wNf6pNZkz/X3QXHdRBe7SfxJDSFOZ5+vN4D/PrnHGayBonpIPtPERJ9/3FkFBvDAvDRF3qKANt2dHizv/58K2ofDTx0jXf/LuDouXFPi6uXx9AiAH0HPtcn75p8OwEqVRmvxTajprrKW6MQT9R9MV0sLC7hePwmlss2rhBgY60AfPiZnpwzeffuGFzav8Z0FAsG2qLNiHU95QHio7/hRnIa/gCH6a4CIz+MnI8jWi8AH3yq/5Ve4b1798EqW8jMpZGazpKAW/DWqzs9wNcnfiIhr6OlOYyG+ggUVcHwmdN4LFJhsPf6P9GTmTLfFduHUqkEmVot0IwbGjm2tT7iAa6O/4upWQMB4Q8azefz4WL8NKINKhnp3UF9PF3k3XtfhivMQ3lQVQ2GkUN2ftoDhOuawXmIHGpCohwwMtXImVNojfgJ0DeoJ67d5u2dPahvbAGTJYLYKJllGPklD8CDVfBpKl2m/mwHc7MpXEpcQOfWdQY7dGiocPKHMb9pywiFqqHQQYvEFBsQ4RElwiU2odC7ReBcbpESaeOVFzqK7HIikRn75ffgVGraE1GmDkSJ/FEeHzy7/yfcpg6EiBtamtHxzJP5/wCfX23rX0ZOXQAAAABJRU5ErkJggg==';
        this.transformImageSize = 12;

        this.removeImage = new Image();
        this.removeImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADBklEQVQ4TzVTW4iNURhd+z/mnBkMjuu4zZhhDBO5JkW5JDHCyINrya1IePHgYV6U8uASohTlQY2oScmUN3ciIxqDMIxxmxk6xzHnnP+697b2PuOv3b9v3/rWt761xacT+ypiKGqAlusRhdBBwOFDyQg68qF9rkMP0u67UBH/UQTl5Zpk/u9R0Xny4CWl9CpHRmUqDKACDxaIlyxQSBAO5Xv2zOybcxW4XSoMm0Xn8QNSS+lo3+Uh0bWGcnPQHtda8SKD3V4SlDCfymcJyERkSHQlOo7t+SMiOdigO6WDkRhdiaC7E157mwWyWQlUXD4ZRcPKkGt7Bv9HBwHJUsqM6DiyI0XqSUCjpGYWkkvWIfj5Benbjci9fcEkHkqqajFs9XbER41Hz9WzyDxsButniE6Lzw1bUkrKpMmUKCvHkMX16D95JnKtT5AiiKE6dMUmDJy+ANmX99Fz7Rzybc8LDJRMi/bDG1KQUVKyNt5GfEylZREfO4FMOk0WxEeXw21/jV9NF8iqBdrNQziCIFFafDxUn0IYkYERK2trLqmaaimXzltmhcs8akZP42kyeFjoAoNBUbVUafFhf12KdPoAeq3qJROnYfjanRg0f3kB4MEtdDeeQrblfqEbMYdslZEtLd7vXZrSkUzKnBFFIVFejaErt6J4fDX87+3c0kiMq4L7sZUsziD35hmTaDhFRDYAb3cuZAmBFbG4oobUt2FA7Tz0ttzB7xsXCaAwvH4XSucuQfb5XXRdOU6QVxDC+iIt3mydQwYh2wiUzl6EEet2w/v6AT3XzyP36rERCv2nzsXIzQetF35ePobMvZt0ZkAQArRtnPGH1rRG6pccYev3vn2C+66Ffs8XRBMxgsxAYmwVsq1P2Z1vDNbcR0a8Xj9FUlFH9llZOA5NQrvS+yaFYaBZM2IUP15EY4WmdrbRaqBE65pJl9iFVSryy8zjMT43SgvWbs1CHxQegbVEIZBd5LSLs2bxoq6yIqbCBhXk+ZxNb43HmcVkln3BBuD/lMH2E2jyFY7+A3NWA4NtG5kTAAAAAElFTkSuQmCC';
        this.removeImageSize = 12;

        this.textEditor = new Image();
        this.textEditor.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACUUlEQVQ4T5WTSVMTQRTH/z2aKskeMimyoUdLLa54UMqbC19ASSz1ywnZCIlKvKgH4YBfQC5JkASE7CseApn2vZ5kMOLFnpqpntfdv7f8+4mt/AcJSEj68pA8oVc9bOP55B/G1D6xkV0wwD53wzz9n6PRaEBkc++lwz6H4dkvdqe8WlFYkZgerWhorus66vU6xCYBnApwpjbpfj/sdjuGw+FlSgS22WywXbehVC4reyAQQL1WI8DWO+l02DEYmoBHKw9oUf9nMqPRCNlsDucX51hYCKJ2esKAPAEc6A+G5HkOq08fo1QqY+/bHuKxmAIVCh/h1/24v7yMnd1dlMsHCAZDBDiFyGTz0uUkQH9Aeflx985tfPr8BeztzetXCrBdKFC4daysPESr1cb3/X0EQyEzhfRmTrpdTvR6fVLJwJjCG4/HEELDy/jaJAICNJpkEzAMA4KsCwRQEaQzW9LtdqHb60HSosFaE4hHbO35DEDThKVSKBTGyc9jiFQ6Kz0eNzrd7hWppgBOoVEnzTXNUiYcjuD4qAqRTG9Kr8eDdqczozMrEo+9MGuwTSmQ5to1zYogEoniqFohQCojvV4v2u22eWUn7+qzJ/D5fArAa193dtDtdK3LFokuolo9hEgk05I3tlqtGcDS0r1JTcx6FItFdVu5gNwR0ehNVCs/IDYSKTk/P49ms2kBOE6u9ti4IIjZQDyEOm4CFhdvoXJIgPWNpPTT9f17cCoMmSpCGkKjIrKUU1Dl8ADi7XqC9v7RLMxXXvkwu7usi4pk2myTxvsNYYatB2W4yn8AAAAASUVORK5CYII=';
        this.textEditorSize = 12;

        this.entries = [];
        this.selected = null;
        this.dragged = null;
        this.transfromSelected = false;

        this.stickerList = JSON.parse(window.localStorage.getItem('stickerList')) || [];

        if (restoreUUID !== undefined) {
            this.uuid = restoreUUID;
            this.restore(restoreUUID);
        } else {
            if (!this.getStickerData()) {
                this.uuid = this.guid();
                this.resize(width, height);
            } else {
                this.uuid = this.getStickerData().uuid;
                this.restore();
            }
        }
    };

    Sticker.prototype = {
        constructor: Sticker,

        inverted: false,
        flipped: false,

        onmousedown: function(e) {
            var x = this.flipped ? this.canvas.width - e.layerX : e.layerX,
                y = e.layerY,
                old = this.selected,
                target;

            if ((target = this.getTarget(x, y)) !== null) {
                this.select(target);
                this.selected.dragStartX = x - (this.selected.x * this.zoomRate);
                this.selected.dragStartY = y - (this.selected.y * this.zoomRate);

                if (this.selected.transformArea(x, y, this.transformImageSize, this.zoomRate)) {
                    this.transfromSelected = true;
                } else if (old === this.selected && this.selected.removeArea(x, y, this.removeImageSize, this.zoomRate)) {
                    if (window.confirm('Are you sure you want to delete this item?')) {
                        this.remove(this.selected);
                    }
                } else if (old === this.selected && this.selected instanceof textEntry && this.selected.editorArea(x, y, this.textEditorSize, this.zoomRate)) {
                    if (typeof this.ontextEdit === 'function') this.ontextEdit();
                } else {
                    this.dragged = target;
                    this.transfromSelected = false;
                }
            } else {
                this.deselect();
            }

            this.update();
        },

        onmousemove: function(e) {
            var x = this.flipped ? this.canvas.width - e.layerX : e.layerX,
                y = e.layerY;

            if (this.dragged !== null) {
                this.dragged.x = (x - this.dragged.dragStartX) / this.zoomRate;
                this.dragged.y = (y - this.dragged.dragStartY) / this.zoomRate;

                this.update();
            } else if (this.transfromSelected && this.selected !== null) {
                var selectedX = this.selected.x * this.zoomRate;
                var selectedY = this.selected.y * this.zoomRate;
                var selectedWidth = this.selected.width * this.zoomRate;
                var selectedHeight = this.selected.height * this.zoomRate;

                if (this.selected instanceof imageEntry) {
                    if (x > selectedX + this.transformImageSize) this.selected.width = (x - selectedX) / this.zoomRate;
                    if (y > selectedY + this.transformImageSize) this.selected.height = (y - selectedY) / this.zoomRate;
                } else if (y > selectedY + this.transformImageSize) {
                    this.selected.height = y - selectedY;
                    this.selected.size = Math.round(this.selected.height / this.selected.lines.length / this.zoomRate) + 'px';
                    this.selected.setTextStyle();
                }

                this.update();
            }
        },

        onmouseup: function() {
            this.dragged = null;
            this.transfromSelected = false;
        },

        onmouseleave: function() {
            // this.dragged = null;
        },

        getTarget: function(x, y) {
            // loop backward for get the top entry
            for (var i = this.entries.length - 1; i >= 0; i--) {
                if (this.entries[i].accept(x, y, this.zoomRate)) return this.entries[i];
            }

            return null;
        },

        select: function(entry) {
            this.deselect();
            this.selected = entry;
            this.selected.borderWidth = 1;

            this.update();

            if (typeof this.onselect === 'function') this.onselect();
        },

        deselect: function() {
            if (this.selected !== null) {
                this.selected.borderWidth = 0;
                this.selected = null;
                this.update();

                if (typeof this.ondeselect === 'function') this.ondeselect();
            }
        },

        push: function(entry) {
            this.entries.push(entry);
            this.select(entry);

            return entry;
        },

        add: function(type, data) {
            var ret = type === 'text' ? new textEntry(this.ctx, data) : new imageEntry(this.ctx, data);

            if (ret instanceof imageEntry) {
                var widthRatio = ret.width / (this.width * 0.9);
                var heightRatio = ret.height / (this.height * 0.9);
                var ratio = Math.max(widthRatio, heightRatio);

                if (ratio > 1) {
                    ret.width = ret.width / ratio | 0;
                    ret.height = ret.height / ratio | 0;
                }
            }

            return this.push(ret);
        },

        remove: function(entry) {
            var index = this.entries.indexOf(entry);

            if (index !== -1) {
                this.entries.splice(index, 1);
                this.deselect();
            }
        },

        resize: function(width, height) {
            this.ctx.save();

            this.width = +width || 0;
            this.height = +height || 0;

            this.canvas.width = this.width * (this.zoomRate || 1);
            this.canvas.height = this.height * (this.zoomRate || 1);

            this.ctx.restore();

            this.update();
        },

        refresh: function() {
            this.resize(this.width, this.height);
        },

        zoom: function(zoomBy) {
            if (zoomBy) {
                this.zoomRate = Math.max(this.zoomRate + zoomBy, 0.25);
            } else {
                this.zoomRate = 1;
            }
        },

        zoomIn: function() {
            this.zoom(0.25);
        },

        zoomOut: function() {
            this.zoom(-0.25);
        },

        getDimension: function(conversion) {
            var self = this,
                top = [],
                right = [],
                bottom = [],
                left = [],
                dimW, dimH;

            this.each(function(entry) {
                var TL = entry.realXY(entry.x, entry.y, self.zoomRate);
                var TR = entry.realXY(entry.x + entry.width, entry.y, self.zoomRate);
                var BR = entry.realXY(entry.x + entry.width, entry.y + entry.height, self.zoomRate);
                var BL = entry.realXY(entry.x, entry.y + entry.height, self.zoomRate);

                top.push(Math.min(TL.y, TR.y, BR.y, BL.y));
                right.push(Math.max(TL.x, TR.x, BR.x, BL.x));
                bottom.push(Math.max(TL.y, TR.y, BR.y, BL.y));
                left.push(Math.min(TL.x, TR.x, BR.x, BL.x));
            });

            dimW = Math.max.apply(Math, right) - Math.min.apply(Math, left);
            dimH = Math.max.apply(Math, bottom) - Math.min.apply(Math, top);

            if (typeof conversion === 'number') {
                dimW /= conversion;
                dimH /= conversion;
            }

            if (!window.isFinite(dimW)) dimW = 0;
            if (!window.isFinite(dimH)) dimH = 0;

            return {
                width: dimW || 0,
                height: dimH || 0
            };
        },

        forwardTarget: function() {
            this.order(this.entries.length - 1);
        },

        backwardTarget: function() {
            this.order(0);
        },

        order: function(o) {
            var index, entry;

            if (this.selected !== null) {
                index = this.entries.indexOf(this.selected);

                if (index !== -1) {
                    entry = this.entries.splice(index, 1)[0];
                    this.entries.splice(o, 0, entry);

                    this.update();
                }
            }
        },

        update: function() {
            this.clear();

            this.ctx.save();
            this.ctx.beginPath();

            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.flipped) {
                this.ctx.translate(this.canvas.width, 0);
                this.ctx.scale(-1, 1);
            }

            this.each(this.render.bind(this));

            this.ctx.closePath();
            this.ctx.restore();

            if (this.inverted) {
                var imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

                for (var i = 0, il = imgData.data.length; i < il; i += 4) {
                    imgData.data[i] = 255 - imgData.data[i];
                    imgData.data[i + 1] = 255 - imgData.data[i + 1];
                    imgData.data[i + 2] = 255 - imgData.data[i + 2];
                }

                this.ctx.putImageData(imgData, 0, 0);
            }

            this.ctx.beginPath();
            this.ctx.strokeStyle = this.gridColor;
            this.ctx.lineWidth = this.gridLineWidth;

            for (var i = 0; i <= this.canvas.width; i += this.gridSize) {
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i, this.canvas.height);
            }

            for (var j = 0; j <= this.canvas.height; j += this.gridSize) {
                this.ctx.moveTo(0, j);
                this.ctx.lineTo(this.canvas.width, j);
            }

            this.ctx.stroke();
            this.ctx.closePath();

            if (typeof this.onupdate === 'function') this.onupdate();
        },

        render: function(entry) {
            this.ctx.save();

            var entryX = entry.x * this.zoomRate;
            var entryY = entry.y * this.zoomRate;
            var entryWidth = entry.width * this.zoomRate;
            var entryHeight = entry.height * this.zoomRate;

            if (entry.angle !== 0) {
                this.ctx.translate(entryX + entryWidth / 2, entryY + entryHeight / 2);
                this.ctx.rotate(entry.angle * DEG_RAD);
                this.ctx.translate(-(entryX + entryWidth / 2), -(entryY + entryHeight / 2));
            }

            entry.draw(this.zoomRate);
            entry.drawBorder(this.zoomRate);

            if (this.selected === entry) {
                this.ctx.drawImage(
                    this.transformImage,
                    0, 0,
                    this.transformImage.width, this.transformImage.height,
                    entryX + entryWidth - (entryWidth > 0 ? this.transformImageSize : 0),
                    entryY + entryHeight - (entryHeight > 0 ? this.transformImageSize : 0),
                    this.transformImageSize, this.transformImageSize
                );

                if (entryWidth > this.transformImageSize + this.textEditorSize && entry instanceof textEntry) {
                    this.ctx.drawImage(
                        this.textEditor,
                        0, 0,
                        this.textEditor.width, this.textEditor.height,
                        entryX, entryY + entryHeight - this.textEditorSize,
                        this.textEditorSize, this.textEditorSize
                    );
                }

                if (entryHeight > this.transformImageSize + this.removeImageSize) {
                    this.ctx.drawImage(
                        this.removeImage,
                        0, 0,
                        this.removeImage.width, this.removeImage.height,
                        entryX + entryWidth - this.removeImageSize, entryY,
                        this.removeImageSize, this.removeImageSize
                    );
                }
            }

            this.ctx.restore();
        },

        clear: function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },

        each: function(callback) {
            this.entries.forEach(callback);
        },

        rotate: function(a, antiClockWise) {
            if (this.selected !== null) {
                this.selected.rotate(a, antiClockWise);
                this.update();
            }
        },

        flip: function(val) {
            var w = this.canvas.width;

            this.flipped = typeof val === 'boolean' ? val : !this.flipped;
            this.update();
        },

        invert: function(val) {
            this.inverted = typeof val === 'boolean' ? val : !this.inverted;
            this.update();
        },

        setBg: function(bgColor) {
            this.bgColor = bgColor;
            this.update();
        },

        setFontType: function(font) {
            textEntry.prototype.font = font;

            if (this.selected instanceof textEntry) {
                this.selected.font = font;
                this.selected.setTextStyle();
                this.update();
            }
        },

        setTextAlign: function(align) {
            textEntry.prototype.hAlign = align;

            if (this.selected instanceof textEntry) {
                this.selected.hAlign = align;
                this.selected.setTextStyle();
                this.update();
            }
        },

        setFontSize: function(size) {
            size = +size;

            if (size > this.transformImageSize) {
                textEntry.prototype.size = size + 'px';

                if (this.selected instanceof textEntry) {
                    this.selected.height = size;
                    this.selected.size = size + 'px';
                    this.selected.setTextStyle();
                    this.update();
                }
            }
        },

        setFontColor: function(color) {
            textEntry.prototype.color = color;

            if (this.selected instanceof textEntry) {
                this.selected.color = color;
                this.update();
            }
        },

        setFontBold: function(color) {
            if (this.selected instanceof textEntry) {
                this.selected.bold = !this.selected.bold;
                this.update();
                this.update();
            }

            textEntry.prototype.bold = !textEntry.prototype.bold;
        },

        setFontItalic: function(color) {
            if (this.selected instanceof textEntry) {
                this.selected.italic = !this.selected.italic;
                this.update();
            }

            textEntry.prototype.italic = !textEntry.prototype.italic;
        },

        setFontUnderline: function(color) {
            if (this.selected instanceof textEntry) {
                this.selected.underline = !this.selected.underline;
                this.update();
            }

            textEntry.prototype.underline = !textEntry.prototype.underline;
        },

        data: function(type) {
            return this.canvas.toDataURL('image/' + (type || 'png'));
        },

        save: function(setInactive) {
            var
                overwrite = this.getStickerData(this.uuid),
                stickerSettings = ['width', 'height', 'inverted', 'flipped', 'bgColor'],
                stickerConfig = {},
                stickerEntries = []
            ;

            stickerSettings.forEach(function(key) {
                stickerConfig[key] = this[key];
            }, this);

            stickerConfig.dimWidth = Math.round(this.getDimension(PX_PER_CM).width);
            stickerConfig.dimHeight = Math.round(this.getDimension(PX_PER_CM).height);

            stickerConfig.priceBaseWidth = this.supportImages ? this.width / PX_PER_CM : stickerConfig.dimWidth;
            stickerConfig.priceBaseHeight = this.supportImages ? this.height / PX_PER_CM : stickerConfig.dimHeight;

            this.entries.forEach(function(entry) {
                stickerEntries.push( entry.getConfig() );
            });

            if (overwrite !== null) {
                overwrite.stickerConfig = stickerConfig;
                overwrite.stickerEntries = stickerEntries;
                overwrite.active = !setInactive;
            } else {
                this.stickerList.push({
                    uuid: this.uuid,
                    imgSupport: this.supportImages,
                    stickerConfig: stickerConfig,
                    stickerEntries: stickerEntries,
                    active: !setInactive
                });
            }

            window.localStorage.setItem('stickerList', JSON.stringify(this.stickerList));
        },

        restore: function(id) {
            var _this = this,
                stickerData = this.getStickerData(id),
                done = 0,
                stickerSettings,
                stickerEntries,
                key, i, il, item, entry, itemKey, img;

            if (stickerData === null) {
                this.resize(this.width, this.height);
                return void 0;
            }

            stickerSettings = stickerData.stickerConfig;
            stickerEntries = stickerData.stickerEntries;

            if (stickerSettings !== null) {
                for (key in stickerSettings) {
                    if (stickerSettings.hasOwnProperty(key)) this[key] = stickerSettings[key];
                }
            }

            this.resize(this.width, this.height);

            if (stickerEntries !== null) {
                for (i = 0, il = stickerEntries.length; i < il; i++) {
                    item = stickerEntries[i];

                    if ('text' in item) { // textEntry
                        entry = this.add('text', item.text);
                        for (itemKey in item) {
                            if (item.hasOwnProperty(itemKey)) entry[itemKey] = item[itemKey];
                        }
                        if (++done === il) _this.update();
                    } else if (this.supportImages) {
                        img = new Image();
                        img.onload = (function(conf) {
                            var ee = _this.add('image', this),
                                kk;

                            for (kk in conf) {
                                if (conf.hasOwnProperty(kk) && kk !== 'image') ee[kk] = conf[kk];
                            }

                            if (++done === il) _this.update();
                        }).bind(img, item);
                        img.src = item.image;
                    }
                }
            }
        },

        getStickerData: function(id) {
            var i = this.stickerList.length - 1;

            if (id) {
                for (i; i >= 0; i--) {
                    if (this.stickerList[i].uuid === id && this.stickerList[i].imgSupport === this.supportImages) return this.stickerList[i];
                }
            } else {
                for (i; i >= 0; i--) {
                    if (this.stickerList[i].imgSupport === this.supportImages && this.stickerList[i].active) return this.stickerList[i];
                }
            }

            return null;
        },

        guid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);

                return v.toString(16);
            });
        }
    };

    var
        helperCanvas = document.createElement('canvas'),
        helperCtx = helperCanvas.getContext('2d')
    ;

    var Entry = function(layer) {
        this.layer = layer;

        this.angle = 0;
    };

    Entry.prototype = {
        constructor: Entry,

        x: 20,
        y: 20,

        width: 0,
        height: 0,

        borderWidth: 1,
        borderColor: '#000000',
        borderStyle: 'solid',

        angle: 0,

        accept: function(x, y, rate) {
            return this.insideRect(x, y, this.x * rate, this.y * rate, this.width * rate, this.height * rate, rate);
        },

        insideRect: function(px, py, x, y, w, h, rate) {
            if (x === undefined) x = this.x;
            if (y === undefined) y = this.y;
            if (w === undefined) w = this.width;
            if (h === undefined) h = this.height;

            var TL = this.realXY(x, y, rate);
            var TR = this.realXY(x + w, y, rate);
            var BR = this.realXY(x + w, y + h, rate);
            var BL = this.realXY(x, y + h, rate);

            var pairs = [[TL, TR], [TR, BR], [BR, BL], [BL, TL]];

            for (var i = 0, il = pairs.length; i < il; i++) {
                if (!this.leftSide(px, py, pairs[i][0].x, pairs[i][1].x, pairs[i][0].y, pairs[i][1].y)) return false;
            }

            return true;
        },

        leftSide: function(px, py, x1, x2, y1, y2) {
            // http://stackoverflow.com/questions/2752725/finding-whether-a-point-lies-inside-a-rectangle-or-not#answer-2752753

            var A = -(y2 - y1);
            var B = x2 - x1;
            var C = -(A * x1 + B * y1);
            var D = A * px + B * py + C;

            return D > 0;
        },

        lowestOrLargestPos: function(xORy, largest, rate) {
            var TL = this.realXY(this.x * rate, this.y * rate, rate);
            var TR = this.realXY(this.x * rate + this.width * rate, this.y * rate, rate);
            var BR = this.realXY(this.x * rate + this.width * rate, this.y * rate + this.height * rate, rate);
            var BL = this.realXY(this.x * rate, this.y * rate + this.height * rate, rate);

            var items = [TR, BR, BL];
            var searched = TL;

            if (!largest) {
                items.forEach(function(item) {
                    if (item[xORy] < searched[xORy]) searched = item;
                });
            } else {
                items.forEach(function(item) {
                    if (item[xORy] > searched[xORy]) searched = item;
                });
            }

            return searched;
        },

        realX: function(rate) {
            return this.realXY(this.x * rate, this.y * rate, rate).x;
        },

        realY: function(rate) {
            return this.realXY(this.x * rate, this.y * rate, rate).y;
        },

        realXY: function(x, y, rate) {
            var r = this.angle * DEG_RAD;

            return {
                x: (x - (this.x * rate + this.width * rate / 2)) * Math.cos(r) - (y - (this.y * rate + this.height * rate / 2)) * Math.sin(r) + this.x * rate + this.width * rate / 2,
                y: (x - (this.x * rate + this.width * rate / 2)) * Math.sin(r) + (y - (this.y * rate + this.height * rate / 2)) * Math.cos(r) + this.y * rate + this.height * rate / 2
            };
        },

        transformArea: function(x, y, size, rate) {
            return this.insideRect(
                x, y, // check x, y
                this.x * rate + this.width * rate - size, this.y * rate + this.height * rate - size, // rect x, y
                size, size, // rect w, h
                rate
            );

            /*return	x >= this.x + this.width  - size &&
                    y >= this.y + this.height - size &&
                    x <= this.x + this.width  + size &&
                    y <= this.y + this.height + size;*/
        },

        removeArea: function(x, y, size, rate) {
            return this.insideRect(
                x, y, // check x, y
                this.x * rate + this.width * rate - size, this.y * rate, // rect x, y
                size, size, // rect w, h
                rate
            );

            /*return	x >= this.x + this.width - size &&
                    y >= this.y &&
                    x <= this.x + this.width &&
                    y <= this.y + size;*/
        },

        editorArea: function(x, y, size, rate) {
            return this.insideRect(
                x, y, // check x, y
                this.x * rate, this.y * rate + this.height * rate - size, // rect x, y
                size, size, // rect w, h
                rate
            );

            /*return	x >= this.x &&
                    y >= this.y + this.height - size &&
                    x <= this.x + size &&
                    y <= this.y + this.height;*/
        },

        rotate: function(a, antiClockWise) {
            this.angle += (window.parseInt(a, 10) || 0) * (antiClockWise ? -1 : 1);
            this.angle %= 360;
        },

        clone: function() {
            var clone = this instanceof imageEntry ? new imageEntry(this.layer, this.image) : new textEntry(this.layer, this.text),
                prop;

            for (prop in this) {
                if (Object.prototype.hasOwnProperty.call(this, prop)) clone[prop] = this[prop];
            }

            clone.x += 15;
            clone.y += 15;

            return clone;
        },

        drawBorder: function(rate) {
            rate = Math.max(rate || 1, 0.25);

            if (this.borderWidth > 0) {
                this.layer.beginPath();
                this.layer.strokeStyle = this.borderColor;
                this.layer.lineWidth = this.borderWidth;
                this.layer.strokeRect(this.x * rate, this.y * rate, this.width * rate, this.height * rate);
                this.layer.closePath();
            }
        }
    };

    var textEntry = function(layer, text) {
        Entry.call(this, layer);
        this.text = text;
        this.setLines();
        this.setTextStyle();
        this.setWidth();
        this.setHeight();

        this.font = this.font;
        this.size = this.size;
        this.color = this.color;
        this.bold = this.bold;
        this.italic = this.italic;
        this.underline = this.underline;
        this.hAlign = this.hAlign;
    };

    textEntry.prototype = Object.create(Entry.prototype);
    textEntry.constructor = Entry;

    Object.assign(textEntry.prototype, {
        size: '30px',
        color: 'rgb(0, 0, 0)',
        font: 'Arial',
        bold: false,
        italic: false,
        underline: false,
        hAlign: 'left',
        vAlign: 'top'
    });

    textEntry.prototype.setText = function(txt) {
        this.text = txt;
        this.setLines();
    };

    textEntry.prototype.setLines = function() {
        this.lines = String(this.text).split('\n');
    };

    textEntry.prototype.setHeight = function() {
        this.height = window.parseInt(this.size, 10) * (this.lines.length + 0.1) || 0;
    };

    textEntry.prototype.setTextStyle = function() {
        var fontStyle = '';

        if (this.bold) fontStyle += 'bold ';
        if (this.italic) fontStyle += 'italic ';

        fontStyle += this.size + ' ';
        fontStyle += this.font;

        this.layer.font = fontStyle;
        this.layer.fillStyle = this.color;
        this.layer.textAlign = this.hAlign;
        this.layer.textBaseline = this.vAlign;

        this.setWidth();
        this.setHeight();
    };

    textEntry.prototype.setWidth = function() {
        var longest = 0,
            actual = 0,
            i = 0,
            il = this.lines.length;

        for (; i < il; i++) {
            if ((actual = this.layer.measureText(this.lines[i]).width) > longest) longest = actual;
        }

        return this.width = longest;
    };

    textEntry.prototype.draw = function(rate) {
        this.setTextStyle();
        this.multiLineText(rate);
    };

    textEntry.prototype.getConfig = function() {
        var configKeys = ['x', 'y', 'width', 'height', 'angle', 'text', 'size', 'color', 'font', 'bold', 'italic', 'underline', 'hAlign', 'vAlign'],
            config = {},
            i, il;

        for (i = 0, il = configKeys.length; i < il; i++) config[configKeys[i]] = this[configKeys[i]];

        return config;
    };

    textEntry.prototype.getUnderlineRate = function() {
        var fontHeightRate;

        switch (this.font.toLowerCase()) {
            case 'arial':
            case 'sans-serif':
                fontHeightRate = 0.93;
                break;

            case 'tahoma':
            case 'verdana':
                fontHeightRate = 1.03;
                break;

            case 'times new roman':
            case 'serif':
                fontHeightRate = 0.91;
                break;

            case 'courier new':
                fontHeightRate = 0.85;
                break;

            default:
                fontHeightRate = 1;
        }

        return fontHeightRate;
    };

    textEntry.prototype.multiLineText = function(rate) {
        var sizeCache = this.size;
        this.size = Math.round(window.parseInt(this.size, 10) * rate) + 'px';
        this.setTextStyle();

        var il = this.lines.length,
            lh = window.parseInt(this.size, 10),
            fx = this.x * rate,
            fy = this.y * rate,
            i, w, y, m, ur, uxr;

        switch (this.hAlign) {
            case 'left':
            case 'start':
                uxr = 0; break;
            case 'center':
                uxr = 0.5; break;
            case 'right':
            case 'end':
                uxr = 1; break;
        }

        fx += uxr * this.width * 1;

        switch (this.vAlign) {
            case 'top':		fy += 0; break;
            case 'middle':	fy += lh / 2; break;
            case 'bottom':	fy += lh; break;
        }

        if (this.underline) {
            this.layer.beginPath();
            this.layer.strokeStyle = this.color;
            ur = this.getUnderlineRate();
            this.layer.lineWidth = window.parseInt(this.size, 10) / 20 | 0 || 1;
        }

        for (i = 0; i < il; i++, fy += lh) {
            this.layer.fillText(this.lines[i], fx, fy);

            if (this.underline) {
                y = this.y * rate + i * Math.max(0, lh - 1) + lh * ur;
                w = this.layer.measureText(this.lines[i]).width;
                m = uxr * (this.width * rate - w);
                this.layer.moveTo(this.x * rate + m, y);
                this.layer.lineTo(this.x * rate + m + w, y);
            }
        }

        if (this.underline) {
            this.layer.stroke();
            this.layer.closePath();
        }

        this.size = sizeCache;
        this.setTextStyle();
    };

    var imageEntry = function(layer, image) {
        Entry.call(this, layer);
        this.image = image;

        this.width = image.width;
        this.height = image.height;
    };

    imageEntry.prototype = Object.create(Entry.prototype);
    imageEntry.constructor = Entry;

    imageEntry.prototype.draw = function(rate) {
        rate = Math.max(rate || 1, 0.25);
        this.layer.drawImage(this.image, 0, 0, this.image.width, this.image.height, this.x * rate, this.y * rate, this.width * rate, this.height * rate);
    };

    imageEntry.prototype.getConfig = function() {
        var configKeys = ['x', 'y', 'width', 'height', 'angle'],
            config = {},
            i, il, w, h;

        for (i = 0, il = configKeys.length; i < il; i++) config[configKeys[i]] = this[configKeys[i]];

        /*w = helperCanvas.width = this.image.width;
        h = helperCanvas.height = this.image.height;

        helperCtx.drawImage(
            this.image,
            0, 0, w, h,
            0, 0, w, h
        );

        config.image = helperCanvas.toDataURL('image/png');*/
        config.image = this.image.src;

        return config;
    };

    window.Sticker = Sticker;
    window.textEntry = textEntry;
    window.imageEntry = imageEntry;
}(window, (function() {
    if (Object.assign === undefined) {
        Object.assign = function(target) {
            for (var i = 1, il = arguments.length, prop; i < il; i++) {
                for (prop in arguments[i]) {
                    if (Object.prototype.hasOwnProperty.call(arguments[i], prop)) target[prop] = arguments[i][prop];
                }
            }
        };
    }
}())));
