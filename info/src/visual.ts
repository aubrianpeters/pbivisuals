/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {

    interface ITarget {
        min: number;
        mid: number;
        max: number;
        minColor: Fill;
        midColor: Fill;
        maxColor: Fill;
    }

    interface ISymbol {
        symbol: string;
        symbolColor: Fill;
    }

    interface IInfoViewModel {
        currentValue: number;
        tooltip: string;
        targets: ITarget;
        symbol: ISymbol;
        stroke: number;
    };

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): IInfoViewModel {
        const defaultMinColor: Fill = { solid: { color: "#fd625e" } };
        const defaultMidColor: Fill = { solid: { color: "#f2c80f" } };
        const defaultMaxColor: Fill = { solid: { color: "#01b8aa" } };
        const defaultSymbolColor: Fill = { solid: { color: "#000000" } };

        const targets: ITarget = { min: 0, mid: 0.5, max: 1, minColor: defaultMinColor, midColor: defaultMidColor, maxColor: defaultMaxColor };
        const viewModel: IInfoViewModel = { currentValue: 0.5, tooltip: "0.5", targets: targets, symbol: { symbol: "?", symbolColor: defaultSymbolColor }, stroke: 0.2 };

        if (options.dataViews !== undefined &&
            options.dataViews[0] !== undefined &&
            options.dataViews[0].metadata !== undefined) {

            if (options.dataViews[0].metadata.objects !== undefined) {
                // Targets
                targets.min = getCategoricalValue(options, 0, "min", getObjectValue<number>(options.dataViews[0].metadata.objects, "target", "min", 0.0));
                targets.mid = getCategoricalValue(options, 0, "mid", getObjectValue<number>(options.dataViews[0].metadata.objects, "target", "mid", 0.5));
                targets.max = getCategoricalValue(options, 0, "max", getObjectValue<number>(options.dataViews[0].metadata.objects, "target", "max", 1.0));
                targets.minColor = getObjectValue<Fill>(options.dataViews[0].metadata.objects, "target", "minColor", defaultMinColor);
                targets.midColor = getObjectValue<Fill>(options.dataViews[0].metadata.objects, "target", "midColor", defaultMidColor);
                targets.maxColor = getObjectValue<Fill>(options.dataViews[0].metadata.objects, "target", "maxColor", defaultMaxColor);

                // View Model
                viewModel.currentValue = getCategoricalValue(options, 0, "value", 0.5);
                viewModel.tooltip = getCategoricalValue(options, 0, "tooltip", getCategoricalValue(options, 0, "value", 0.5).toString());
                viewModel.symbol.symbol = getObjectValue<string>(options.dataViews[0].metadata.objects, "symbol", "symbol", "?");
                viewModel.symbol.symbolColor = getObjectValue<Fill>(options.dataViews[0].metadata.objects, "symbol", "symbolColor", defaultSymbolColor);
                viewModel.stroke = getObjectValue<number>(options.dataViews[0].metadata.objects, "stroke", "width", 0.2);
            } else if (options.dataViews[0].metadata.columns !== undefined) {
                // Targets
                targets.min = getCategoricalValue(options, 0, "min", getColumnValue<number>(options.dataViews[0].metadata.columns, "target", "min", 0.0));
                targets.mid = getCategoricalValue(options, 0, "mid", getColumnValue<number>(options.dataViews[0].metadata.columns, "target", "mid", 0.5));
                targets.max = getCategoricalValue(options, 0, "max", getColumnValue<number>(options.dataViews[0].metadata.columns, "target", "max", 1.0));
                targets.minColor = getColumnValue<Fill>(options.dataViews[0].metadata.columns, "target", "minColor", defaultMinColor);
                targets.midColor = getColumnValue<Fill>(options.dataViews[0].metadata.columns, "target", "midColor", defaultMidColor);
                targets.maxColor = getColumnValue<Fill>(options.dataViews[0].metadata.columns, "target", "maxColor", defaultMaxColor);

                // View Model
                viewModel.currentValue = getCategoricalValue(options, 0, "value", 0.5);
                viewModel.tooltip = getCategoricalValue(options, 0, "tooltip", getCategoricalValue(options, 0, "value", 0.5).toString());
                viewModel.symbol.symbol = getColumnValue<string>(options.dataViews[0].metadata.columns, "symbol", "symbol", "?");
                viewModel.symbol.symbolColor = getColumnValue<Fill>(options.dataViews[0].metadata.columns, "symbol", "symbolColor", defaultSymbolColor);
                viewModel.stroke = getColumnValue<number>(options.dataViews[0].metadata.columns, "stroke", "width", 0.2);
            }
        }

        // constrain stroke to valid values.
        if (viewModel.stroke < 0)
            viewModel.stroke = 0;
        if (viewModel.stroke > 1)
            viewModel.stroke = 1;

        return viewModel;
    }

    export class Visual implements IVisual {
        private host: IVisualHost;
        private root;
        private svg: d3.Selection<SVGElement>;

        private viewModel: IInfoViewModel;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            for (let i = options.element.children.length - 1; i >= 0 ; i--) {
                options.element.children[i].remove();
            }
            this.root = d3.select(options.element);
            this.svg = this.root.append("svg");
        }

        update(options: VisualUpdateOptions) {
            if (!options.viewport)
                return;

            // don't display anything smaller than minimum size of 40,40
            if (options.viewport.width < 20)
                options.viewport.width = 20;
            if (options.viewport.height < 20)
                options.viewport.height = 20;

            this.viewModel = visualTransform(options, this.host);

            this.root.attr("title", this.viewModel.tooltip);

            const getFontSize: () => number = () => ((options.viewport.width > options.viewport.height ? options.viewport.height : options.viewport.width) * (1 - this.viewModel.stroke - 0.02)) / 2;
            const getStrokeColor: (vm: any) => d3.Rgb = vm => {
                var c1: d3.Rgb;
                var c2: d3.Rgb;
                var point: number;

                if (vm.currentValue === vm.targets.mid) {
                    return d3.rgb(vm.targets.midColor.solid.color);
                } else if (vm.currentValue < vm.targets.mid) {
                    c1 = d3.rgb(vm.targets.midColor.solid.color);
                    c2 = d3.rgb(vm.targets.minColor.solid.color);
                    point = (vm.currentValue - vm.targets.min) / (vm.targets.mid - vm.targets.min);
                    if (point < 0) point = 0;
                    if (point > 1) point = 1;
                    return d3.rgb((c1.r - c2.r) * point + c2.r, (c1.g - c2.g) * point + c2.g, (c1.b - c2.b) * point + c2.b);
                } else {
                    c1 = d3.rgb(vm.targets.maxColor.solid.color);
                    c2 = d3.rgb(vm.targets.midColor.solid.color);
                    point = (vm.currentValue - vm.targets.mid) / (vm.targets.max - vm.targets.mid);
                    if (point < 0) point = 0;
                    if (point > 1) point = 1;
                    return d3.rgb((c1.r - c2.r) * point + c2.r, (c1.g - c2.g) * point + c2.g, (c1.b - c2.b) * point + c2.b);
                }
            };

            this.svg.selectAll("*").remove();
            this.svg.attr("width",options.viewport.width);
            this.svg.attr("height", options.viewport.height);

            const radius = (options.viewport.width < options.viewport.height ? options.viewport.width : options.viewport.height) / (1 + this.viewModel.stroke) / 2 - 1;

            this.svg.append("svg:circle")
                .attr("cx", options.viewport.width / 2)
                .attr("cy", options.viewport.height / 2)
                .attr("r", radius)
                .style("fill", "rgba(255, 255, 255, 0.0)")
                .style("stroke", getStrokeColor(this.viewModel).toString())
                .style("stroke-width", this.viewModel.stroke * radius * 2 + "px");

            this.svg.append("svg:text")
                .text(this.viewModel.symbol.symbol)
                .attr("fill", this.viewModel.symbol.symbolColor.solid.color)
                .attr("style", `text-anchor: middle; font-weight:bold; font-size:${getFontSize()}px;`)
                .attr("x", options.viewport.width / 2)
                .attr("y", options.viewport.height / 2 + getFontSize() / 3);
        }

        enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const objectName = options.objectName;
            const objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case "target":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            min: this.viewModel.targets.min,
                            minColor: this.viewModel.targets.minColor,
                            mid: this.viewModel.targets.mid,
                            midColor: this.viewModel.targets.midColor,
                            max: this.viewModel.targets.max,
                            maxColor: this.viewModel.targets.maxColor
                        },
                        selector: null
                    });
					break;
                case "stroke":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            width: this.viewModel.stroke
                        },
                        selector: null
                    });
					break;
                case "symbol":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            symbol: this.viewModel.symbol.symbol,
                            symbolColor: this.viewModel.symbol.symbolColor
                        },
                        selector: null
                    });
					break;
            };

            return objectEnumeration;
        }

        destroy(): void { }
    }
}