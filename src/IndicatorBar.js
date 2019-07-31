import React, { Component } from 'react';
import './IndicatorBar.css';

class IndicatorBar extends Component{
	constructor(props){
		super(props);
		
		this.ruler = React.createRef();
	}
	componentDidMount(){
		let ruler = this.ruler.current;
		let val = !!this.props.value ? this.props.value * 100 * 0.8 : 0;
		ruler.style.left = val + "%";
	}
	render(){
		return (
			<div className="IndicatorBarDiv">
				<div className="IndicatorBarLabel IndicatorBarCentered">
					{this.props.label ? this.props.label : ""}
				</div>
				<div
					className="IndicatorBarBackground IndicatorBarCentered"
				>
					<div className="IndicatorBarRuler"
							ref={this.ruler}>
					</div>
				</div>
			</div>
		);
	}
}

export default IndicatorBar;