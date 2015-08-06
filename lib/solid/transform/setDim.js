export function setDim(dim, value){
    let d = {x:0, y:0, z:0}
    d[dim] = value - this.position[dim]
    this.translate(d.x,d.y,d.z)
}
