import React from 'react';
import './../App.css';
import *  as d3 from 'd3';
import * as _ from 'lodash';
import Nyc from './nyc-map'

const styles = {
    overflow: "hidden"
}

class MapView extends React.Component {

    constructor(props) {
        super(props);
        this.mapView = React.createRef()
    }

    renderLoading() {
        return <div>Loading...</div>;
    }

    renderError() {
        return <div>Error: {this.props.error}</div>;
    }

    componentDidUpdate() {
        var svg = d3.select("svg");

        this.zoom = d3.zoom()
            .scaleExtent([.5, 8])
            .on("zoom", this.zoomed);

        svg.call(this.zoom);
    }

    zoomed(event) {
        var g = d3.select("g");

        g.style("stroke-width", .25 / event.transform.k + "px");
        g.attr("transform", event.transform);
    }

    renderMap() {

        return (
            <div id="map" style={styles} ref={this.mapView} className="map">
                <svg id="nyc-map" height="100%" width="100%">
                    <g>{this.props.map}</g>
                </svg>
            </div>
        );
    }

    render() {

        if (this.props.loading) {
            return this.renderLoading();
        }
        else if (this.props.map) {
            return this.renderMap();
        }
        else {
            return this.renderError();
        }
    }
}

class MapContainer extends React.Component {
    state = { loading: true, map: [], pickupLastSelected: false, height: 0, width: 0 };

    constructor(props) {
        super(props);
        this.mapViewRef = React.createRef()
    }

    componentDidUpdate(prevProps) {
        
        if (prevProps !== this.props || 
            this.mapViewRef.current.mapView.current.offsetHeight !== this.state.height ||
            this.mapViewRef.current.mapView.current.offsetWidth !== this.state.width) {
            this.setState({
                height: this.mapViewRef.current.mapView.current.offsetHeight, 
                width: this.mapViewRef.current.mapView.current.offsetWidth
            }, () => this.buildMap());
        }
    }

    componentDidMount() {
        
        this.buildMap();
    }

    isSelected = (key) => 
        ((this.props.dropoffSelection !== null && key === this.props.dropoffSelection.locationId) ||
        (this.props.pickupSelection !== null && key === this.props.pickupSelection.locationId));

    updateSelection = (zone) => {
        if (!this.state.pickupLastSelected) {
            this.props.updatePickupSelection(zone);
            this.setState({ pickupLastSelected: true });
        }
        else {
            this.props.updateDropoffSelection(zone);
            this.setState({ pickupLastSelected: false });
        }
    }

    calculateOpacity = (numRides, maxNumRides) => {
        let percentageOfMaxRides = numRides / maxNumRides;
        return percentageOfMaxRides > .03 ? percentageOfMaxRides : .03;
    }

    buildMap() {
        // let map = this.state.map;
        // let rc = Rough.svg(map, {
        //   async: true,
        //   options: {
        //     simplification: 0.2, roughness: 0.65
        //   }
        // });

        let leastDimension = this.state.width > this.state.height ? this.state.height : this.state.width;

        var projection = d3.geoAlbers()
            .center([0, 40.70])
            .rotate([73.98, 0])
            .parallels([41, 44])
            .translate([this.state.width / 2, this.state.height / 2])
            .scale(leastDimension*125);

        //Define path generator
        var path = d3.geoPath()
            .projection(projection);

        let zones = _.map(Nyc.features, (feature, i) => {

            let p = path(feature);
            return this.props.chloroplethData === null 
            ? 
                <path 
                    d={p} 
                    onClick={() => this.updateSelection({ label: feature.properties.zone, locationId: feature.properties.locationid })} 
                    key={i} 
                    locationid={feature.properties.locationid}
                    fillOpacity={.25}
                    stroke="black"
                    zone={feature.properties.zone}
                    className={this.isSelected(feature.properties.locationid) ? "selected" : feature.properties.borough}>
                    <title>{feature.properties.zone}</title>
                </path>
            :
                <path 
                    d={p} 
                    onClick={() => this.updateSelection({ label: feature.properties.zone, locationId: feature.properties.locationid })} 
                    key={i} 
                    locationid={feature.properties.locationid}
                    zone={feature.properties.zone}
                    fill="blue" 
                    fillOpacity={this.calculateOpacity(this.props.chloroplethData.data.get(feature.properties.locationid), this.props.chloroplethData.maxRides)}
                    stroke="gold"
                    strokeWidth={this.isSelected(feature.properties.locationid) ? .5 : 0}>
                    <title>
                        {feature.properties.zone 
                        + " " 
                        + this.props.chloroplethData.data.get(feature.properties.locationid).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </title>
                </path>;
        });

        this.setState({ loading: false, map: zones });
    }

    render() {
        return <MapView ref={this.mapViewRef} {...this.state} />;
    }
}

export default MapContainer;
