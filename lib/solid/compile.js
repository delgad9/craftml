import q from '../query'
import union from './union'


export default function compile() {

    let $ = q(this)

    this.apply()

    let csgs = []
    $(this).find('csg').each(function(){
        if (this.csg && this.role != 'cut'){
            let csg = this.csg.transform(this.m)
            csgs.push(csg)
        }
    })

    let whole = union(csgs)
    return whole
}
