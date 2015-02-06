(function ($, window, undefined) {

    $.widget("mobile.pagecontainer", $.mobile.pagecontainer, {
        load: function (url, options) {
            // This function uses deferred notifications to let callers
            // know when the content is done loading, or if an error has occurred.
            var deferred = (options && options.deferred) || $.Deferred(),

				// The default load options with overrides specified by the caller.
				settings = $.extend({}, this._loadDefaults, options),

				// The DOM element for the content after it has been loaded.
				content = null,

				// The absolute version of the URL passed into the function. This
				// version of the URL may contain dialog/subcontent params in it.
				absUrl = $.mobile.path.makeUrlAbsolute(url, this._findBaseWithDefault()),
				fileUrl, dataUrl, pblEvent, triggerData;

            // DEPRECATED reloadPage
            settings.reload = settings.reloadPage;

            // If the caller provided data, and we're using "get" request,
            // append the data to the URL.
            if (settings.data && settings.type === "get") {
                absUrl = $.mobile.path.addSearchParams(absUrl, settings.data);
                settings.data = undefined;
            }

            // If the caller is using a "post" request, reload must be true
            if (settings.data && settings.type === "post") {
                settings.reload = true;
            }

            // The absolute version of the URL minus any dialog/subcontent params.
            // In otherwords the real URL of the content to be loaded.
            fileUrl = this._createFileUrl(absUrl);

            // The version of the Url actually stored in the data-url attribute of
            // the content. For embedded content, it is just the id of the page. For
            // content within the same domain as the document base, it is the site
            // relative path. For cross-domain content (Phone Gap only) the entire
            // absolute Url is used to load the content.
            dataUrl = this._createDataUrl(absUrl);

            content = this._find(absUrl);

            //to appen view html
            if (content.length == 0) {
                //$.trigger('appendViewHtml', absUrl);
                $.mobile.appendViewHtml(absUrl);
                content = this._find(absUrl);
            }

            // If it isn't a reference to the first content and refers to missing
            // embedded content reject the deferred and return
            if (content.length === 0 &&
				$.mobile.path.isEmbeddedPage(fileUrl) &&
				!$.mobile.path.isFirstPageUrl(fileUrl)) {
                deferred.reject(absUrl, settings);
                return deferred.promise();
            }

            // Reset base to the default document base
            // TODO figure out why we doe this
            this._getBase().reset();

            // If the content we are interested in is already in the DOM,
            // and the caller did not indicate that we should force a
            // reload of the file, we are done. Resolve the deferrred so that
            // users can bind to .done on the promise
            if (content.length && !settings.reload) {
                this._enhance(content, settings.role);
                deferred.resolve(absUrl, settings, content);

                //if we are reloading the content make sure we update
                // the base if its not a prefetch
                if (!settings.prefetch) {
                    this._getBase().set(url);
                }

                return deferred.promise();
            }

            triggerData = {
                url: url,
                absUrl: absUrl,
                toPage: url,
                prevPage: options ? options.fromPage : undefined,
                dataUrl: dataUrl,
                deferred: deferred,
                options: settings
            };

            // Let listeners know we're about to load content.
            pblEvent = this._triggerWithDeprecated("beforeload", triggerData);

            // If the default behavior is prevented, stop here!
            if (pblEvent.deprecatedEvent.isDefaultPrevented() ||
				pblEvent.event.isDefaultPrevented()) {
                return deferred.promise();
            }


            //if (settings.showLoadMsg) {
            //    this._showLoading(settings.loadMsgDelay);
            //}

            // Reset base to the default document base.
            // only reset if we are not prefetching
            if (settings.prefetch === undefined) {
                this._getBase().reset();
            }

            if (!($.mobile.allowCrossDomainPages ||
				$.mobile.path.isSameDomain($.mobile.path.documentUrl, absUrl))) {
                deferred.reject(absUrl, settings);
                return deferred.promise();
            }

            // Load the new content.
            $.ajax({
                url: fileUrl,
                type: settings.type,
                data: settings.data,
                contentType: settings.contentType,
                dataType: "html",
                success: this._loadSuccess(absUrl, triggerData, settings, deferred),
                error: this._loadError(absUrl, triggerData, settings, deferred)
            });

            return deferred.promise();
        },
        _hideLoading: function () { },
        _showLoading: function () { }
    });

    //不可删除此方法，用于重写JQM的loading
    $.extend($.mobile, {
        loading: function () {
            // If this is the first call to this function, instantiate a loader widget
            //var loader = this.loading._widget || $($.mobile.loader.prototype.defaultHtml).loader(),

            //	// Call the appropriate method on the loader
            //	returnValue = loader.loader.apply(loader, arguments);

            //// Make sure the loader is retained for future calls to this function.
            //this.loading._widget = loader;

            //return returnValue;
        }
    });


    //JQM 中 $.mobile.Transition.prototype 委托给 $.mobile.ConcurrentTransition.prototype，所以必须重写$.mobile.ConcurrentTransition.prototype
    $.extend($.mobile.ConcurrentTransition.prototype, {
        startIn: function (screenHeight, reverseClass, none, preventFocus) {
            this.hideIn(function () {
                this.$to.addClass($.mobile.activePageClass + this.toPreClass);

                // Send focus to page as it is now display: block
                if (!preventFocus) {
                    $.mobile.focusPage(this.$to);
                }

                // Set to page height
                //this.$to.height( screenHeight + this.toScroll );
                if (!none) {
                    this.scrollPage();
                }
            });

            //第一个页面通过此处修改
            this.$to
				.removeClass(this.toPreClass)
				.addClass(this.name + " in " + reverseClass);

            //this.$to.css({ "padding-top": "0px", "padding-bottom": "0px" });
            if (!none) {
                this.$to.animationComplete($.proxy(function () {
                    this.doneIn();
                }, this));
            } else {
                this.doneIn();
            }

        },
        startOut: function (screenHeight, reverseClass, none) {
            this.beforeStartOut(screenHeight, reverseClass, none);

            // Set the from page's height and start it transitioning out
            // Note: setting an explicit height helps eliminate tiling in the transitions
            //this.$to.css({ "padding-top": 0, "padding-bottom": 0 });
            this.$from
				//.height( screenHeight + $.mobile.window.scrollTop() )
				.addClass(this.name + " out" + reverseClass);

        }
    });


})(jQuery, this);