import * as fs from "fs";


let start ="";
let maxDepth = 0;



function getLinks(html){

    let i = 0;
    
    let links = [];
    while (i < html.length) {
        i = html.indexOf(" href", i); 
        if(i === -1){
            i++;
            break;
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

        if (html.indexOf(tag, i) !== i){
            i++;
            continue;
        }
        i++;

        if(clss.length > 0){

            let not = 0;

            let o = html.indexOf(" class", i);

            if(o === -1){
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


            i+=6;

            if(!(html[i] === " " || html[i] === "=")){
                i++;
                continue;
            }

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
                i = endA;
                continue;
            }
            i++

            while(html[i] !== ">"){
            i++
            }

            i++; //to start the text after finding >

            let end = html.indexOf("<", i);

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

            if(end === -1){
                            break;
                        }

            let txt = html.slice(i, end);

            
            text.push(txt);

            i = end+1;
        }

    }

    return text;
}



let alreadyChecked = {};
let rawdata = [];

function geturl(link){
    if (link.startsWith("http://") || link.startsWith("https://")) {
        return link;
    }

    
    let [protocol, rest] = start.split("://");
    let domainEnd = rest.indexOf("/");
    let domain = domainEnd === -1 ? rest : rest.slice(0, domainEnd);
    let basePath = domainEnd === -1 ? "" : rest.slice(domainEnd);

    
    if (link.startsWith("/")) {
        return `${protocol}://${domain}${link}`;
    }

    // Otherwise, it’s relative; combine paths
    let fullPath = basePath.split("/").filter(Boolean); 
    let relParts = link.split("/");

    for (let part of relParts) {
        if (part === ".") continue;            
        else if (part === "..") fullPath.pop(); 
        else fullPath.push(part);             
    }

    return `${protocol}://${domain}/${fullPath.join("/")}`;
}


async function crawl(url, depth = 0, tag, clss) {
    if(depth > maxDepth || alreadyChecked[url] === true){
        return;
    }
    alreadyChecked[url] = true;
    const req = await fetch(url);
    if (!req.ok) return;
    let html = await req.text();
    
    let links = getLinks(html);
    let texts = getText(html, tag, clss);

    rawdata.push({"link": url, "textArr": texts});

    for(let i = 0; i < links.length; i+=5){
        let chunk = links.slice(i, i+5);
        for(let link of chunk){
            await crawl(geturl(link), depth+1, tag, clss);
            console.log(link);
        }
    }
}  


async function beginCrawl(url, depth = 0, max = 0, tag, clss = "") {
    start = url;
    maxDepth = max;
    await crawl(url, depth, tag, clss);
}   




await beginCrawl("https://books.toscrape.com", 0, 0, "a");
fs.writeFileSync('index.json', JSON.stringify(rawdata, null, 2));