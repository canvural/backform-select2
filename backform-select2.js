(function(root, factory) {

    // Set up Backform appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'backform'], function(_, Backform) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backform.
            return factory(root, _, Backform);
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {
        var _ = require('underscore');
        factory(root, _, root.Backform);

        // Finally, as a browser global.
    } else {
        factory(root, root._, root.Backform);
    }
} (this, function(root, _, Backform) {
    var Select2Formatter = function() {};
    _.extend(Select2Formatter.prototype, {
        fromRaw: function(rawData, model) {
            return encodeURIComponent(rawData);
        },
        toRaw: function(formattedData, model) {
            if (_.isArray(formattedData)) {
                return _.map(formattedData, decodeURIComponent);
            } else {
                if(!_.isNull(formattedData) && !_.isUndefined(formattedData)) {
                    return decodeURIComponent(formattedData);
                } else {
                    return null;
                }
            }
        }
    });

    var Select2Control = Backform.Select2Control = Backform.SelectControl.extend({
        defaults: _.extend({}, Backform.SelectControl.prototype.defaults, {
            select2: {
                multiple: false
            }
        }),
        formatter: Select2Formatter,
        template: _.template([
            '<label class="<%=Backform.controlLabelClassName%>"><%=label%></label>',
            '<div class="<%=Backform.controlsClassName%>">',
            ' <select class="<%=Backform.controlClassName%> <%=extraClasses.join(\' \')%>"',
            '  name="<%=name%>" value="<%-value%>" <%=disabled ? "disabled" : ""%>',
            '  <%=required ? "required" : ""%><%= select2.multiple ? " multiple " : " " %> style="width: 100%">',
            '  <%=select2.first_empty ? " <option></option>" : ""%>',
            '  <% for (var i=0; i < options.length; i++) {%>',
            '   <% var option = options[i]; %>',
            '   <option ',
            '    <% if (option.image) { %> data-image=<%=option.image%> <%}%>',
            '    value=<%= formatter.fromRaw(option.value) %>',
            '    <% if (option.selected) {%>selected="selected"<%} else {%>',
            '    <% if (!select2.multiple && option.value === rawValue) {%>selected="selected"<%}%>',
            '    <% if (select2.multiple && rawValue && rawValue.indexOf(option.value) != -1){%>selected="selected" data-index="rawValue.indexOf(option.value)"<%}%>',
            '    <%}%>',
            '    <%= disabled ? "disabled" : ""%>><%-option.label%></option>',
            '  <%}%>',
            ' </select>',
            '</div>'
        ].join("\n")),
        render: function() {

            if(this.$sel && this.$sel.select2 &&
                this.$sel.select2.hasOwnProperty('destroy')) {
                this.$sel.select2('destroy');
            }

            var field = _.defaults(this.field.toJSON(), this.defaults),
                attributes = this.model.toJSON(),
                attrArr = field.name.split('.'),
                name = attrArr.shift(),
                path = attrArr.join('.'),
                rawValue = this.keyPathAccessor(attributes[name], path),
                data = _.extend(field, {
                    rawValue: rawValue,
                    value: this.formatter.fromRaw(rawValue, this.model),
                    attributes: attributes,
                    formatter: this.formatter
                }),
                evalF = function(f, d, m) {
                    return (_.isFunction(f) ? !!f.apply(d, [m]) : !!f);
                };

            data.select2 = data.select2 || {};
            _.defaults(data.select2, this.defaults.select2, {
                first_empty: true,
                multiple: false
            });

            // Evaluate the disabled, visible, and required option
            _.extend(data, {
                disabled: evalF(data.disabled, data, this.model),
                visible:  evalF(data.visible, data, this.model),
                required: evalF(data.required, data, this.model)
            });

            // Evaluation the options
            if (_.isFunction(data.options)) {
                try {
                    data.options = data.options(this);
                } catch(e) {
                    // Do nothing
                    data.options = [];
                }
            }

            // Clean up first
            this.$el.removeClass(Backform.hiddenClassname);

            if (!data.visible)
                this.$el.addClass(Backform.hiddenClassname);

            this.$el.html(this.template(data)).addClass(field.name);

            var select2Opts = _.extend({
                disabled: data.disabled
            }, field.select2, {
                options: (this.field.get('options') || this.defaults.options)
            });

            /*
             * Add empty option as Select2 requires any empty '<option><option>' for
             * some of its functionality to work and initialize select2 control.
             */
            this.$sel = this.$el.find("select").select2(select2Opts);

            // Select the highlighted item on Tab press.
            if (this.$sel) {
                this.$sel.data('select2').on("keypress", function(ev) {
                    var self = this;

                    // keycode 9 is for TAB key
                    if (ev.which === 9 && self.isOpen()) {
                        ev.preventDefault();
                        self.trigger('results:select', {});
                    }
                });
            }

            this.updateInvalid();

            return this;
        },
        getValueFromDOM: function() {
            var val = Backform.SelectControl.prototype.getValueFromDOM.apply(
                this, arguments
                ),
                select2Opts = _.extend({}, this.field.get("select2") || this.defaults.select2);

            if (select2Opts.multiple && val === null) {
                return [];
            }
            return val;
        }
    });
}));