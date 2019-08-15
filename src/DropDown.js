import React, { Component } from 'react';
import './DropDown.css';

class DropDown extends Component{
	constructor(props){
		super(props);
		
		this.dropDownContentRef = React.createRef();
		
		this.onItemClicked = this.onItemClicked.bind(this);
		this.dropDownArrowButtonClicked = this.dropDownArrowButtonClicked.bind(this);
		this.hideDropDownContent = this.hideDropDownContent.bind(this);
		this.showDropDownContent = this.showDropDownContent.bind(this);
	}
	onItemClicked(id){
		this.props.itemClicked(id);
		this.hideDropDownContent();
	}
	dropDownArrowButtonClicked(){
		this.hideDropDownContent();
	}
	showDropDownContent(){
		let ddc = this.dropDownContentRef.current;
		if(ddc.style.display != "block" || ddc.style.display === "none"){
			ddc.style.display = "block";
		}
	}
	hideDropDownContent(){
		let ddc = this.dropDownContentRef.current;
		ddc.style.display = "none";
	}
	render(){
		let tags 		= this.props.tags;
		let indicators = this.props.labels;
		
		let slctdId = this.props.selectedId;
		
		let tarIndicator = indicators[slctdId];
		
		return (
			<div className="DropDown"
					onMouseLeave={this.hideDropDownContent}>
				<div className="DropDownButtonDiv"
						onMouseEnter={this.showDropDownContent}>
					<div className="DropDownButton"
							onClick={this.showDropDownContent}>
						{tarIndicator}
					</div>
					<div className="DropDownArrowButton"
							onClick={this.dropDownArrowButtonClicked}>
						&#11167;
					</div>
				</div>
				<div className="DropdownContent"
						ref={this.dropDownContentRef}>
					{tags.map((tag, id)=>
						<div className={"DropdownItem " + ((id === slctdId) ? "selected" : "")}
							  onClick={()=>this.onItemClicked(id)}
							  key={id}>
							{tag}
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default DropDown;

