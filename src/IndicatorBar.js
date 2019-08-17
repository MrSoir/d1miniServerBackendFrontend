import React, { Component } from 'react';
import './IndicatorBar.css';

class IndicatorBar extends Component{
	constructor(props){
		super(props);
		
		this.rf = React.createRef();
	}
	componentDidMount(){
		let ind = this.rf.current;
	}
	render(){
		let val = !!this.props.value ? this.props.value * 100 * 0.8 : 0;
		let style = {
			left: '' + val + '%'
		};
		let indicator = (
					<div className="IndicatorBarRuler" style={style}
						  ref={this.rf}>
					</div>
					);
		
		return (
			<div className="IndicatorBarDiv">
				<div className="IndicatorBarLabel IndicatorBarCentered">
					{this.props.label ? this.props.label : ""}
				</div>
				<div
					className="IndicatorBarBackground IndicatorBarCentered"
				>
					{indicator}
				</div>
			</div>
		);
	}
}

export default IndicatorBar;