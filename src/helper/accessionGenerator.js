const accessionGenerator = (s) => {
    const n = s.length
    for(let i=n-1;i>=0;i--) {
        if(i<=n-5) {
            if(i==0 && s[i]=='Z') {
                s = "A"+s;
                break
            }
            if(s[i]=='Z') s = s.substring(0,i)+"A"+s.substring(i+1,n)
            else {
                let changedChar = String.fromCharCode(s.charCodeAt(i)+1)
                s = s.substring(0,i)+changedChar+s.substring(i+1,n)
                break
            }
        }
        else if(s[i]!='9') {
            let changed = String.fromCharCode((s.charCodeAt(i)+1))
            s = s.substring(0,i) + changed + s.substring(i+1,n)
            break
        }
        else {
            s = s.substring(0,i)+"0"+s.substring(i+1,n)
        }
    }
    return s
};


module.exports = accessionGenerator