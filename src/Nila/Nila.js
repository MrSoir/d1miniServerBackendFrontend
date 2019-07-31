import React, { Component } from 'react';
import { Switch, Route, withRouter } from "react-router-dom";
import SlideShow from '../SlideShow/SlideShow';
import meta_info from './info.txt';
import './Nila.css';

// modules_backend_frontend:
import {readTextFile} from 'staticfunctions';


class Nila extends Component{
	constructor(){
		super();
		
		this.state = {
			imagePaths: []
		}
		
		this.imageClicked = this.imageClicked.bind(this);
		this.loadImages = this.loadImages.bind(this);
	}
	componentWillMount() {
		this.loadImages();
   }
   componentDidMount(){
   	window.scrollTo(0, 0);
   }
   loadImages(){
   	let txt = readTextFile(meta_info);
   	let publicImgPaths = [];
		
		let infos = txt.split('\n').filter(tn => !!tn);
		
		// erste zeile enthaelt imgCount: 'imgCount: 13'
		let imgCnt = infos[0].split(' ');
		imgCnt = parseInt( imgCnt[imgCnt.length - 1] );
		
		for(let i=0; i < imgCnt; ++i){
			let tarImg = process.env.PUBLIC_URL + '/Nila/Nila_' + i + '.jpg';
			publicImgPaths.push(tarImg);
		}
   	
   	this.setState( {imagePaths: publicImgPaths} );
   }
   imageClicked(){
   
   }

	render(){
		const f = pth => {
			return {img_path: pth};
		}
		return (
			<div>
				<SlideShow img_paths={this.state.imagePaths.map(pth => f(pth))} />
			</div>
		);
	}
}

export default withRouter( Nila );


