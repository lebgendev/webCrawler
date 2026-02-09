import * as fs from "fs";


let start = "https://www.imdb.com/chart/top/";
let maxDepth = 0;



function getLinks(html){

    let i = 0;
    
    let links = [];
    while (i < html.length) {
        i = html.indexOf("href", i); 
        if(i === -1){
            break;
        }

        let prev = html[i-1];
        if(prev && /[a-z0-9_-]/i.test(prev)){
            i+=4;
            continue;
        }

        i+=4;

        while (html[i] && /\s/.test(html[i])) i++;

        if (html[i] !== "=") continue;
        i++;

        while (html[i] && /\s/.test(html[i])) i++;

        const quote = html[i];
        if (quote !== '"' && quote !== "'") continue;
        i++;

        let start = i;
        let end = html.indexOf(quote, start);
        if (end === -1) break;
        let link = html.slice(start, end);
        links.push(link);
        i = end + 1;
    }

  
    return links;
}


function getText(html, tag, clss=""){
    let i = 0;
    let text = [];
    while(i< html.length){
        i = html.indexOf("<", i); 
        if(i === -1){
            break;
        }
        i++;

        while (html[i] && /\s/.test(html[i])) i++;

        if (html.indexOf(tag, i) !== i) continue;
        i++;

        if(clss.length > 0){

            let not = 0;

            let o = html.indexOf("class", i);

            if(o === -1){
                i++
                break;
            }

            while(i !== o){
                if(html[i] === ">"){
                    not = 1;
                    i++;
                    break;
                }
                i++;
            }

            if(not){
                not = 0;
                continue;
            }

            let prev = html[i-1];
            if(prev && /[a-z0-9_-]/i.test(prev)){
                i+=5;
                continue;
            }

            let nxt = html[i+1];
            if(nxt && /[a-z0-9_-]/i.test(nxt)){
                i++;
                continue;
            }

            i+=5;

            while (html[i] && /\s/.test(html[i])) i++;

            if (html[i] !== "=") continue;
            i++;

            while (html[i] && /\s/.test(html[i])) i++;

            const quote = html[i];
            if (quote !== '"' && quote !== "'") continue;
            i++;
            
            let start = i;
            let endA = html.indexOf(quote, start);
            if(!html.slice(start, endA).split(/\s+/).includes(clss)){
                i++;
                continue;
            }
            i++

            while(html[i] !== ">"){
            i++
            }

            i++; //to start the text after finding >

            let end = html.indexOf("<", i+1);

            if(end === -1){
                break;
            }

            let txt = html.slice(i, end);

            text.push(txt);

            i = end+1;
        } else {
            while(html[i] !== ">"){
                i++
            }

            i++; //to start the text after finding >

            let end = html.indexOf("<", i+1);

            let txt = html.slice(i, end);

            if(end === -1){
                break;
            }

            text.push(txt);

            i = end+1;
        }

    }

    return text;
}



let alreadyChecked = {};
let rawdata = [];

function geturl(link){
    if(link.startsWith("http://") || link.startsWith("https://")){
        return link;
    } else if(link.startsWith("/")){
        let l = start + link;
        return l;
    }
     else {
        let l = start + "/" + link;
        return l;
    }
}

async function crawl(url, depth = 0) {
    if(depth > maxDepth || alreadyChecked[url] === true){
        return;
    }
    alreadyChecked[url] = true;
    const req = await fetch(url);
    if (!req.ok) return;
    let html = await req.text();
    
    let links = getLinks(html);
    let texts = getText(html, "h3", "ipc-title__text");

    rawdata.push({"link": url, "textArr": texts});

    for(let i = 0; i < links.length; i+=5){
        let chunk = links.slice(i, i+5);
        for(let link of chunk){
            await crawl(geturl(link), depth+1);
            console.log(link);
        }
    }
}  




await crawl(start);
fs.writeFileSync('index.json', JSON.stringify(rawdata, null, 2));