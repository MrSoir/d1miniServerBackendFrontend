import React, { Component } from 'react';
import { withRouter } from "react-router-dom";
import './SlideShow.css';

class SlideShow extends Component{
	constructor(props){
		super(props);
		
		this.mainRef = React.createRef();
		this.imgRef0 = React.createRef();
		this.imgRef1 = React.createRef();
		
		this.curFadingImgId = 0;
		
		this.setCurrentImagePath = this.setCurrentImagePath.bind(this);
		this.onImageClick = this.onImageClick.bind(this);
		this.onPrevClicked = this.onPrevClicked.bind(this);
		this.onNextClicked = this.onNextClicked.bind(this);
		
		this.nextImage = this.nextImage.bind(this);
		this.prevImage = this.prevImage.bind(this);
		
		this.startImageTimer = this.startImageTimer.bind(this);
		this.stopImageTimer = this.stopImageTimer.bind(this);
		this.curId = 0;
		this.lastId = 0;
		this.setCurrentImagePath();
	}
	componentDidMount(){
		if(this.props.width){
			let w = `${this.props.width}px`;
			this.mainRef.current.style.maxWidth = w;
		}
		if(this.props.height){
			let h = `${this.props.height}px`;
			this.mainRef.current.style.maxHeight = h;
		}
		this.startImageTimer();
	}
	componentWillUnmount(){
		this.stopImageTimer();
	}
	startImageTimer(){
		this.stopImageTimer();
		this.imageTimer = setInterval(this.nextImage, 5000);
	}
	stopImageTimer(){
		if( !!this.imageTimer ){
			clearInterval(this.imageTimer);
		}
	}
	setCurrentImagePath(){
		this.lastImgPath = this.props.img_paths[this.lastId];
		this.curImgPath = this.props.img_paths[this.curId];
	}
	updateImage(){
		this.startImageTimer();
		
		const imgRef0 = this.imgRef0.current;
		const imgRef1 = this.imgRef1.current;
		
		this.curFadingImgId = this.curFadingImgId === 0 ? 1 : 0;
		
		let newFocusedImg = this.curFadingImgId === 0 ? imgRef0 : imgRef1;
		if( !!newFocusedImg ){
			newFocusedImg.src = this.curImgPath.img_path;
		}
		
		imgRef0.style.opacity = this.curFadingImgId === 0 ? 1 : 0;
		imgRef1.style.opacity = this.curFadingImgId === 1 ? 1 : 0;
	}
	prevImage(){
		this.lastId = this.curId;
		this.curId -= 1;
		if (this.curId < 0){
			this.curId = this.props.img_paths.length - 1;
		}
		this.setCurrentImagePath();
		this.updateImage();
	}
	nextImage(){
		this.lastId = this.curId;
		this.curId += 1;
		if (this.curId >= this.props.img_paths.length){
			this.curId = 0;
		}
		this.setCurrentImagePath();
		this.updateImage();
	}
	
	onImageClick(){
		this.nextImage();
	}
	onPrevClicked(){
		this.prevImage();
	}
	onNextClicked(){
		this.nextImage();
	}
	render(){
		return(
			<div className="SlideShow"
				  ref={this.mainRef}>
				<div className="NextButton Prev Cursor"
					onClick={this.onPrevClicked}>
					&#11164;
				</div>
				
				<img className="Img0 Cursor" 
					src={this.curImgPath.img_path} 
					ref={this.imgRef0}
					onClick={this.onImageClick}
					alt="logo"/>
				<img className="Img1 Cursor" 
					src={this.props.img_paths[1].img_path} 
					ref={this.imgRef1}
					onClick={this.onImageClick}
					alt="logo"/>
				
				<div className="NextButton Next Cursor"
					onClick={this.onNextClicked}>
					&#x2B9E;
				</div>
			</div>
		);
	}
}

export default withRouter(SlideShow);