const SF = require('staticfunctions');

const arraysEqual = SF.arraysEqual;

function padZeros(num, size=2) {
	var s = "000000000" + num;
	return s.substr(s.length-size);
}
function evalHours(unixtime){
	return Math.floor(unixtime / (60*60));
}
function evalMins(unixtime){
	return Math.floor((unixtime % (60*60)) / 60);
}
function evalSecs(unixtime){
	return Math.floor((unixtime % (60*60)) % 60);
}

//---------------IrrigationEntry----------------------

const subClassesMap = new Map();

function compareVals(v0, v1){
	if(v0 === v1){
		return 0;
	}else if(v0 > v1){
		return 1;
	}else{
		return -1;
	}
}

class IrrigationEntry{
	constructor(begin, duration){
		this.begin = begin;
		this.duration = duration;
		
		this.type = -1;
	}
	
	static createFromObj(obj){
		const cls = subClassesMap.get(obj.type);
		return cls.createFromObj(obj);
	}
	
	compareTo(other){
		return this.begin === other.begin
			? compareVals(this.duration, other.duration)
			: compareVals(this.begin,    other.begin);
	}
	equals(other){
		return this.begin    === other.begin 
			&&  this.duration === other.duration;
	}
	
	
	static parseArdiunoIrrigationEntriesString(entriesStr){
		// entriesStr looks like this:
		// 0,127,27000,60|0,127,27300,30|0,127,27600,30|1,72000,60|1,28200,30

		const irrEntries = [];
		
		const entriesStrings = entriesStr.split('|');
		
		entriesStrings.map(es=>{
			const vals = es.split(',');
			const type = vals[0];
			
			const begin 	= parseInt(vals[1]);
			const duration = parseInt(vals[2]);
			
			if(type === '0'){
				const dow		= parseInt(vals[3]);
				
				irrEntries.push( new RecurringIE(dow, begin, duration) );
			}else if(type === '1'){
				
				irrEntries.push( new OneTimerIE(dow, begin, duration) );
			}else{
				throw 'parseEntriesString - unknown IrrigationEntry: ' + es;
			}
		});
		
		return irrEntries;
	}
	
	static irrigationEntriesEqual(ies0, ies1){
		if(ies0.length != ies1.length){
			return false;
		}
		
		let ies0cp = [...ies0].sort(IrrigationEntry.Comparator);
		let ies1cp = [...ies1].sort(IrrigationEntry.Comparator);
		
		for(let i=0; i < ies0cp.length; ++i){
			if( !ies0cp[i].equals(ies1cp[i]) ){
				return false;
			}
		}
		return true;
	}
	
	getBeginString(){
		const hours = Math.floor(this.begin / (60*60));
		const mins = Math.floor( (this.begin % (60*60)) / 60 );
		const secs = Math.floor( (this.begin % (60*60)) % 60 );
		return `${padZeros(hours)} : ${padZeros(mins)} : ${padZeros(secs)} Uhr`;
	}
	getDurationString(){
		return `${Math.floor(this.duration / 60)} min ${padZeros(this.duration % 60)} sec`;
	}
	
	getUnformattedArduinoString(){
		return  ''  + this.type
				+ '-' + this.begin
			   + '-' + this.duration;
	}
}

IrrigationEntry.Comparator = (ies0, ies1)=>{
	return ies0.compareTo(ies1);
};

//-------------IrrigationEntry -> derived classes------------------------


class RecurringIE extends IrrigationEntry{
	constructor(daysOfWeek, begin, duration){
		super(begin, duration);
		this.daysOfWeek = Array.isArray(daysOfWeek) ? daysOfWeek.sort() : RecurringIE.dowIntValToArr(daysOfWeek);
		
		this.type = 0;
	}
	
	//------------overridden functions------------

	static createFromObj(obj){
		return new RecurringIE(obj.daysOfWeek, obj.begin, obj.duration);
	}
	
	copy(){
		return new RecurringIE(this.daysOfWeek.map(x=>x), this.begin, this.duration);
	}

	getType(){
		return this.type;
	}	
	
	compareTo(other){
		if(this.type === other.type){
			let dow0int =  this.daysOfWeekToInt();
			let dow1int = other.daysOfWeekToInt();
			
			return (dow0int === dow1int)
				? super.compareTo(other)
				: compareVals(dow0int, dow1int);
		}else{
			return compareVals(this.type,  other.type);
		}
	}
	
	equals(ie){
		if(ie.type === ie.type){
			return this.begin === ie.begin &&
				 	 this.duration === ie.duration &&
				 	 arraysEqual(this.daysOfWeek, ie.daysOfWeek);
		}else{
			return false;
		}
	}
	
	getUnformattedArduinoString(){
		return super.getUnformattedArduinoString()
				+ '-' + this.daysOfWeekToInt();
	}
	
	//------------derived class custom functions------------
	
	static dowIntValToArr(intVal){
		let iv = intVal;
		let dow = [];
		for(let i=6; i >= 0; --i){
			let tv = 2 ** i;
			if(iv >= tv){
				dow.push(i);
				iv -= 2**i;
			}
		}
		return dow.sort();
	}
	
	daysOfWeekToInt()
	{
		return this.daysOfWeek.map(wd => 2**wd).reduce((x0, x1) => x0 + x1);
	}

	getDaysString(){
		const daysstr = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		
		if(this.allDaysOfWeek()){
			return 'täglich';
		}else if(this.wochenende()){
			return 'Wochenende';
		}else if(this.unterDerWoche()){
			return 'unter der Woche';
		}else if(this.ascending()){
			const firstDay = daysstr[this.daysOfWeek[0]];
			const lastDay = daysstr[this.daysOfWeek[this.daysOfWeek.length-1]];
			return firstDay + ' - ' + lastDay;
		}

		let tars = '';
		return this.daysOfWeek.map(d=>daysstr[d]).join(', ');
	}
	selectDay(dayId){
		if( !this.daysOfWeek.includes(dayId) ){
			this.daysOfWeek.push(dayId);
		}
		this.daysOfWeek.sort();
	}
	deSelectDay(dayId){
		if( this.daysOfWeek.includes(dayId) ){
			this.daysOfWeek.splice(this.daysOfWeek.indexOf(dayId), 1);
		}
	}
	selectAllDays(){
		this.daysOfWeek = [0,1,2,3,4,5,6];
	}
	deSelectAllDays(){
		this.daysOfWeek = [];
	}
	daySelected(dayId){
		return this.daysOfWeek.includes(dayId);
	}
	allDaysOfWeek(){
		return this.checkForDays( [0,1,2,3,4,5,6] );
	}
	wochenende(){
		return this.checkForDays( [5,6] );
	}
	unterDerWoche(){
		return this.checkForDays( [0,1,2,3,4] );
	}
	checkForDays(refArr){
		return refArr.length === this.daysOfWeek.length &&
				 this.daysOfWeek.every( (d,i) => d===refArr[i] );
	}
	ascending(){
		for(let i=0; i < this.daysOfWeek.length-1; ++i){
			if( this.daysOfWeek[i] + 1 != this.daysOfWeek[i+1] ){
				return false;
			}
		}
		return true;
	}
}

class OneTimerIE extends IrrigationEntry{
	constructor(begin, duration){
		super(begin, duration);
		
		this.type = 0;
	}
	
	//------------overridden functions------------
	
	static createFromObj(obj){
		return new OneTimerIE(obj.begin, obj.duration);
	}
	
	getType(){
		return this.type;
	}
	
	copy(){
		return new OneTimerIE(this.begin, this.duration);
	}
	
	compareTo(other){
		if(this.type === other.type){
			return super.compareTo(other);
		}else{
			return compareVals(this.type, other.type);
		}
	}
	equals(other){
		if(this.type === other.type){
			return super.equals(other);
		}else{
			return false;
		}
	}
	
	getUnformattedArduinoString(){
		return super.getUnformattedArduinoString();
	}
	
	//------------derived class custom functions------------
	
	
}

subClassesMap.set(0, RecurringIE);
subClassesMap.set(1, OneTimerIE);

//module.exports = IrrigationEntry;
const IE = {
	IrrigationEntry,
	RecurringIE,
	OneTimerIE
};


module.exports = IE;

