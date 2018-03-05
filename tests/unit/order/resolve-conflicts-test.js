import {expect} from 'chai'
import resolveConflicts from 'ciena-dagre/order/resolve-conflicts'
import {Graph} from 'ciena-graphlib'
import {sortByProps} from 'dummy/tests/helpers/array-helpers'
import {beforeEach, describe, it} from 'mocha'

describe('order/resolveConflicts', function () {
  let cg

  beforeEach(function () {
    cg = new Graph()
  })

  it('should return back nodes unchanged when no constraints exist', function () {
    const input = [
      {v: 'a', barycenter: 2, weight: 3},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a'], i: 0, barycenter: 2, weight: 3},
      {vs: ['b'], i: 1, barycenter: 1, weight: 2}
    ])
  })

  it('should return back nodes unchanged when no conflicts exist', function () {
    const input = [
      {v: 'a', barycenter: 2, weight: 3},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    cg.setEdge('b', 'a')
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a'], i: 0, barycenter: 2, weight: 3},
      {vs: ['b'], i: 1, barycenter: 1, weight: 2}
    ])
  })

  it('should coalesce nodes when there is a conflict', function () {
    const input = [
      {v: 'a', barycenter: 2, weight: 3},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    cg.setEdge('a', 'b')
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a', 'b'],
        i: 0,
        barycenter: (3 * 2 + 2 * 1) / (3 + 2),
        weight: 3 + 2
      }
    ])
  })

  it('should coalesce nodes when there is a conflict #2', function () {
    const input = [
      {v: 'a', barycenter: 4, weight: 1},
      {v: 'b', barycenter: 3, weight: 1},
      {v: 'c', barycenter: 2, weight: 1},
      {v: 'd', barycenter: 1, weight: 1}
    ]
    cg.setPath(['a', 'b', 'c', 'd'])
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a', 'b', 'c', 'd'],
        i: 0,
        barycenter: (4 + 3 + 2 + 1) / 4,
        weight: 4
      }
    ])
  })

  it('should work with multiple constraints for the same target #1', function () {
    const input = [
      {v: 'a', barycenter: 4, weight: 1},
      {v: 'b', barycenter: 3, weight: 1},
      {v: 'c', barycenter: 2, weight: 1}
    ]
    cg.setEdge('a', 'c')
    cg.setEdge('b', 'c')
    const results = resolveConflicts(input, cg)
    expect(results).to.have.length(1)
    expect(results[0].vs.indexOf('c')).to.be.gt(results[0].vs.indexOf('a'))
    expect(results[0].vs.indexOf('c')).to.be.gt(results[0].vs.indexOf('b'))
    expect(results[0].i).equals(0)
    expect(results[0].barycenter).equals((4 + 3 + 2) / 3)
    expect(results[0].weight).equals(3)
  })

  it('should work with multiple constraints for the same target #2', function () {
    const input = [
      {v: 'a', barycenter: 4, weight: 1},
      {v: 'b', barycenter: 3, weight: 1},
      {v: 'c', barycenter: 2, weight: 1},
      {v: 'd', barycenter: 1, weight: 1}
    ]
    cg.setEdge('a', 'c')
    cg.setEdge('a', 'd')
    cg.setEdge('b', 'c')
    cg.setEdge('c', 'd')
    const results = resolveConflicts(input, cg)
    expect(results).to.have.length(1)
    expect(results[0].vs.indexOf('c')).to.be.gt(results[0].vs.indexOf('a'))
    expect(results[0].vs.indexOf('c')).to.be.gt(results[0].vs.indexOf('b'))
    expect(results[0].vs.indexOf('d')).to.be.gt(results[0].vs.indexOf('c'))
    expect(results[0].i).equals(0)
    expect(results[0].barycenter).equals((4 + 3 + 2 + 1) / 4)
    expect(results[0].weight).equals(4)
  })

  it('should do nothing to a node lacking both a barycenter and a constraint', function () {
    const input = [
      {v: 'a'},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a'], i: 0},
      {vs: ['b'], i: 1, barycenter: 1, weight: 2}
    ])
  })

  it('should treat a node w/o a barycenter as always violating constraints #1', function () {
    const input = [
      {v: 'a'},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    cg.setEdge('a', 'b')
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a', 'b'], i: 0, barycenter: 1, weight: 2}
    ])
  })

  it('should treat a node w/o a barycenter as always violating constraints #2', function () {
    const input = [
      {v: 'a'},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    cg.setEdge('b', 'a')
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['b', 'a'], i: 0, barycenter: 1, weight: 2}
    ])
  })

  it('should ignore edges not related to entries', function () {
    const input = [
      {v: 'a', barycenter: 2, weight: 3},
      {v: 'b', barycenter: 1, weight: 2}
    ]
    cg.setEdge('c', 'd')
    expect(resolveConflicts(input, cg).sort(sortByProps(['vs']))).eqls([
      {vs: ['a'], i: 0, barycenter: 2, weight: 3},
      {vs: ['b'], i: 1, barycenter: 1, weight: 2}
    ])
  })
})
