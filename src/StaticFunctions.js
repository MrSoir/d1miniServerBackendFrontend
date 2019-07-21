function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    let txt = ''
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                txt = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return txt;
}
function arraysEqual(a0, a1){
	if (a0 === a1){return true;}
	if (a0 === null || a1 === null){return false;}
	if (a0.length !== a1.length){return false;}
	
	// 1. zip both arrays -> 2. check if every pair of elements are equal:
	return a0.map((v,i)=>[v, a1[i]]).every(v=>v[0] === v[1]);
}
export {readTextFile, arraysEqual};