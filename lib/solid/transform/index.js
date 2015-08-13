export function transform(tm, tn) {
    this.layout.transform(tm)    
    this.m = this.m.multiply(tm)
}

export * from './land'
export * from './setDim'
export * from './translate'
export * from './translateTo'
export * from './center'
export * from './scale'
export * from './centerDim'
export * from './resize'
export * from './resizeDim'
export * from './fit'
export * from './rotate'
export * from './mirror'
export * from './crop'
