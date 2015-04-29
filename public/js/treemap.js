function getQuoteData() {
    $.get("/getQuotes", function (a) {
        var b = new Date(a.timestamp);
        $("#time-retrieved").text(b.toDateString() + " " + b.toTimeString()), nearestToExpirationContracts = a.NearestToExpirationContracts, root.name = a.name, root.children = a.children, fadeOutLoader(), drawTreeMap()
    })
}
function calculateLegendScale() {
    var a = d3.extent(percentChangeBreakdown);
    a[0] < 0 && a[1] > 0 ? percentChangeScale.range(redYellowGreenColors).domain([a[0], a[0] / 2, 0, a[1] / 2, a[1]]) : a[0] >= 0 ? percentChangeScale.range([redYellowGreenColors[2], redYellowGreenColors[3], redYellowGreenColors[4]]).domain([0, a[1] / 2, a[1]]) : percentChangeScale.range([redYellowGreenColors[0], redYellowGreenColors[1], redYellowGreenColors[2]]).domain([a[0], a[0] / 2, 0])
}
function drawTreeMap() {
    node = root;
    var a = treemap.nodes(root), b = a.filter(function (a) {
        return !a.children
    }), c = a.filter(function (a) {
        return a.children
    }), d = chart.selectAll("g.cell.parent").data(c, function (a) {
        return "p-" + a.name
    }), e = d.enter().append("g").attr("class", "cell parent").on("click", function (a) {
        zoom(a)
    }).append("svg").attr("class", "clip").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", headerHeight);
    e.append("rect").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", headerHeight).style("fill", headerColor), e.append("svg:text").attr("class", "label").attr("transform", "translate(3, 13)").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", headerHeight).text(function (a) {
        return a.name
    });
    var f = d.transition().duration(transitionDuration);
    f.select(".cell").attr("transform", function (a) {
        return "translate(" + a.dx + "," + a.y + ")"
    }), f.select("rect").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", headerHeight).style("fill", headerColor), f.select(".label").attr("transform", "translate(3, 13)").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", headerHeight).text(function (a) {
        return a.name
    }), d.exit().remove();
    var g = chart.selectAll("g.cell.child").data(b, function (a) {
        return "c-" + a.symbol
    }), h = g.enter().append("g").attr("class", "cell child").on("click", function (a) {
        zoom(node === a.parent ? root : a.parent)
    }).on("mouseenter", function (a) {
        showToolTip(a, this)
    });
    h.append("rect").classed("background", !0).style("fill", function (a) {
        return percentChangeScale(a.pctchange)
    }), h.append("svg:text").attr("class", "label").attr("x", function (a) {
        return a.dx / 2
    }).attr("y", function (a) {
        return a.dy / 2
    }).attr("dy", ".35em").style("display", "none").attr("text-anchor", "middle").text(function (a) {
        return a.name
    });
    var i = g.transition().duration(transitionDuration);
    i.select(".cell").attr("transform", function (a) {
        return "translate(" + a.x + "," + a.y + ")"
    }), i.select("rect").attr("width", function (a) {
        return Math.max(.01, a.dx)
    }).attr("height", function (a) {
        return a.dy
    }).style("fill", function (a) {
        return percentChangeScale(a.pctchange)
    }), i.select(".label").attr("x", function (a) {
        return a.dx / 2
    }).attr("y", function (a) {
        return a.dy / 2
    }).attr("dy", ".35em").attr("text-anchor", "middle").style("display", "none").text(function (a) {
        return a.name
    }), g.exit().remove(), d3.selectAll("#cell-number-selection input").on("change", calculateCellValues), d3.selectAll("#area-selection input").on("change", calculateCellValues), drawLegend(), zoom(node)
}
function calculateCellValues() {
    var a = function (a) {
        return filterCellValues(a)
    };
    treemap.value(a).nodes(root), zoom(node)
}
function filterCellValues(a) {
    var b;
    switch ($("input[name=mode]:checked", "#area-selection").val()) {
        case"open_interest":
            b = a.open_interest * filterSelectionValue(a);
            break;
        case"volume":
            b = a.volume * filterSelectionValue(a);
            break;
        case"count":
            b = filterSelectionValue(a)
    }
    return b
}
function filterSelectionValue(a) {
    var b;
    switch ($("input[name=cell-count]:checked", "#cell-number-selection").val()) {
        case"all":
            b = 1;
            break;
        case"nearest":
            b = -1 != nearestToExpirationContracts.indexOf(a.symbol) ? 1 : 0
    }
    return b
}
function zoom(a) {
    $(".ui-tooltip").remove();
    var b = $("input[name=mode]:checked", "#area-selection").val();
    if (a.depth < 2 && "count" != b) {
        $("input:radio[name=mode]").filter("[value=count]").prop("checked", !0);
        var c = function () {
            return 1
        };
        treemap.value(c).nodes(root)
    }
    this.treemap.padding([headerHeight / (chartHeight / a.dy), 0, 0, 0]).nodes(a), percentChangeBreakdown = [], root.children.forEach(function (a) {
        a.children.forEach(function (a) {
            a.children.forEach(function (a) {
                a.area > 0 && percentChangeBreakdown.push(+a.pctchange)
            })
        })
    }), calculateLegendScale(), drawLegend();
    var d = chartWidth / a.dx, e = chartHeight / a.dy, f = a;
    xScale.domain([a.x, a.x + a.dx]), yScale.domain([a.y, a.y + a.dy]), node != f && chart.selectAll(".cell.child .label").style("display", "none"), d3.select("#area-selection").style("visibility", f.depth > 1 ? "visible" : "hidden");
    var g = chart.selectAll("g.cell").transition().duration(transitionDuration).attr("transform", function (a) {
        return "translate(" + xScale(a.x) + "," + yScale(a.y) + ")"
    }).each("start", function () {
        d3.select(this).select("label").style("display", "none")
    }).each("end", function (a, b) {
        b || f === self.root || chart.selectAll(".cell.child").select(".label").style("display", function (a) {
            var b = d * a.dx, c = e * a.dy;
            return b > 35 && c > 20 ? "" : "none"
        }).style("fill", function (a) {
            return idealTextColor(percentChangeScale(a.pctchange))
        })
    });
    g.select(".clip").attr("width", function (a) {
        return Math.max(.01, d * a.dx)
    }).attr("height", function (a) {
        return a.children ? headerHeight : Math.max(.01, e * a.dy)
    }), g.select(".label").attr("width", function (a) {
        return Math.max(.01, d * a.dx)
    }).attr("height", function (a) {
        return a.children ? headerHeight : Math.max(.01, e * a.dy)
    }).text(function (a) {
        return a.name
    }), g.select(".child .label").attr("x", function (a) {
        return d * a.dx / 2
    }).attr("y", function (a) {
        return e * a.dy / 2
    }), g.select("rect").attr("width", function (a) {
        return Math.max(.01, d * a.dx)
    }).attr("height", function (a) {
        return a.children ? headerHeight : Math.max(.01, e * a.dy)
    }).style("fill", function (a) {
        return a.children ? headerColor : percentChangeScale(a.pctchange)
    }), node = a, d3.event && d3.event.stopPropagation()
}
function clearLegend() {
    legendGradient.selectAll("rect").remove(), legendTicks.selectAll("text").remove(), d3.select(".legend-title").remove()
}
function getRGBComponents(a) {
    var b = a.substring(1, 3), c = a.substring(3, 5), d = a.substring(5, 7);
    return {R: parseInt(b, 16), G: parseInt(c, 16), B: parseInt(d, 16)}
}
function showToolTip(a, b) {
    $("#contract-month").text(a.month), $("#contract-last").text(quoteFormatter(a.last) + a.flag);
    var c = percentChangeScale(+a.pctchange);
    $("#contract-change").css("color", c).text((a.change > 0 ? "+" : "") + quoteFormatter(a.change)), $("#contract-pchange").css("color", c).text(a.pchange), $("#contract-volume").text(commaFormatter(+a.volume)), $("#contract-open-interest").text(commaFormatter(+a.open_interest)), $("#contract-time").text(processTimeStamp(a.timestamp)), $(".ui-tooltip").remove(), $(b).tooltip({
        items: b,
        content: $("#tooltip").html(),
        close: function () {
        },
        open: function () {
        }
    })
}
function idealTextColor(a) {
    var b = 105, c = getRGBComponents(a), d = .299 * c.R + .587 * c.G + .114 * c.B;
    return b > 255 - d ? "#000000" : "#ffffff"
}
function drawLegend() {
    clearLegend(), legend.append("svg:text").attr("class", "legend-title").attr("x", -20).attr("y", -15).text("Percent Change");
    var a = 100, b = legendGradientWidth / a, c = percentChangeScale.domain().length - 1, d = d3.extent(percentChangeScale.domain()), e = (d[1] - d[0]) / a;
    legendGradient.selectAll("rect").data(d3.range(d[0], d[1], e)).enter().insert("svg:rect").attr("x", function (a, b) {
        return 2 * b
    }).attr("y", 1).attr("width", b).attr("height", legendGradientHeight).style("fill", function (a) {
        return percentChangeScale(a)
    });
    var f = legendGradientWidth / c;
    legendTicks.selectAll("text").data(percentChangeScale.domain()).enter().insert("svg:text").attr("class", "legend-tick").attr("text-anchor", "center").attr("x", function (a, b) {
        return b * f - 10
    }).attr("y", -4).text(function (a) {
        return a ? d3.format(".1f")(a) + "%" : "0%"
    })
}
function processTimeStamp(a) {
    var b = a;
    if (b) {
        var c = new Date, d = c.getFullYear() + (c.getMonth() < 9 ? "0" : "") + (c.getMonth() + 1) + (c.getDate() < 10 ? "0" : "") + c.getDate();
        b = "000000" == b.substr(8, 6) || b.substr(0, 8) != d ? b.substr(4, 2) + "/" + b.substr(6, 2) + "/" + b.substr(0, 4) : b.substr(8, 2) + ":" + b.substr(10, 2) + ":" + b.substr(12, 2) + " CST"
    } else b = "&nbsp;";
    return b
}
function fadeOutLoader() {
    $(".statusBox").fadeOut(), $("#preloader").fadeOut("slow")
}
var chartWidth = 1e3, chartHeight = 500, xScale = d3.scale.linear().range([0, chartWidth]), yScale = d3.scale.linear().range([0, chartHeight]), percentChangeBreakdown = [], headerHeight = 20, headerColor = "#555555", transitionDuration = 500, root = {}, node, redYellowGreenColors = colorbrewer.RdYlGn[5], percentChangeScale = d3.scale.linear(), commaFormatter = d3.format(","), quoteFormatter = function (a) {
    var b = a.split(".");
    return b.length < 2 ? b + "-" + 0 : b[0] + "-" + String(8 * b[1])[0]
}, months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], nearestToExpirationContracts = [], legend, legendGradient, legendTicks, legendGradientWidth = 200, legendGradientHeight = 30;
legend = d3.select(".legend").append("svg").attr("width", "250px").attr("height", "70px").append("g").attr("transform", "translate(30, 30)"), legendGradient = legend.append("g"), legendTicks = legend.append("g");
var treemap = d3.layout.treemap().sort(function (a, b) {
    return b.index - a.index
}).round(!1).size([chartWidth, chartHeight]).sticky(!0).value(function () {
    return 1
}), chart = d3.select("#main").append("svg").attr("id", "treemap").attr("width", chartWidth).attr("height", chartHeight).append("g");
getQuoteData();