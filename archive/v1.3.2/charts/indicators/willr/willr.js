/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'common/loadCSS'], function($) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        loadCSS('charts/indicators/willr/willr.css');

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [];

        $.get("charts/indicators/willr/willr.html" , function ( $html ) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");
            //$html.find('select').selectmenu(); TODO for some reason, this does not work
            $html.find("input[type='button']").button();

            $html.find("#willr_stroke").colorpicker({
                part:	{
                    map:		{ size: 128 },
                    bar:		{ size: 128 }
                },
                select:			function(event, color) {
                    $("#willr_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok:             			function(event, color) {
                    $("#willr_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var table = $html.find('#willr_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false
            });
            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth, value.dashStyle]).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    } );
            });
            $html.find('#willr_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select levels to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#willr_level_add').click(function () {
                require(["charts/indicators/willr/willr_level"], function(willr_level) {
                    willr_level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth, value.dashStyle]).draw().node())
                                .data("level", value)
                                .on('click', function () {
                                    $(this).toggleClass('selected');
                                } );
                        });
                    });
                });
            });


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            //console.log('Ok button is clicked!');
                            require(["validation/validation"], function(validation) {

                                if (!validation.validateNumericBetween($html.find(".willr_input_width_for_period").val(),
                                                parseInt($html.find(".willr_input_width_for_period").attr("min")),
                                                parseInt($html.find(".willr_input_width_for_period").attr("max"))))
                                {
                                    require(["jquery", "jquery-growl"], function($) {
                                        $.growl.error({ message: "Only numbers between " + $html.find(".willr_input_width_for_period").attr("min")
                                                + " to " + $html.find(".willr_input_width_for_period").attr("max")
                                                + " is allowed for " + $html.find(".willr_input_width_for_period").closest('tr').find('td:first').text() + "!" });
                                    });
                                    return;
                                }

                                require(['charts/indicators/highcharts_custom/willr'], function ( willr ) {
                                    willr.init();
                                    var levels = [];
                                    $.each(table.rows().nodes(), function () {
                                        var data = $(this).data('level');
                                        if (data) {
                                            levels.push({
                                                color: data.stroke,
                                                dashStyle: data.dashStyle,
                                                width: data.strokeWidth,
                                                value: data.level,
                                                label: {
                                                    text: data.level
                                                }
                                            });
                                        }
                                    });
                                    var options = {
                                        period : parseInt($html.find(".willr_input_width_for_period").val()),
                                        stroke : defaultStrokeColor,
                                        strokeWidth : parseInt($html.find("#willr_strokeWidth").val()),
                                        dashStyle : $html.find("#willr_dashStyle").val(),
                                        levels : levels
                                    };
                                    //Add WILLR for the main series
                                    $($(".willr").data('refererChartID')).highcharts().series[0].addWILLR(options);
                                });

                                closeDialog.call($html);

                            });
                        }
                    },
                    {
                        text: "Cancel",
                        click: function() {
                            closeDialog.call(this);
                        }
                    }
                ]
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".willr").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".willr").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
