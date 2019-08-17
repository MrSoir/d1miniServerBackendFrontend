import React, { Component } from 'react';
import TabElement from './TabElement';
import './Tab.css';

class Tab extends Component{
	componentDidMount(){
	}

	render(){
		return (
		<div className="Tab">
			{this.props.tabs.map((tab, id)=>
				<TabElement name={tab.name}
								key={id}
								selected={tab.selected}
								onClick={()=>{this.props.onClick(id);}}
				/>
			)}
		</div>
		);
	}
}

export default Tab;


