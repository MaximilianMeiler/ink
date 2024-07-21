import './App.css';

function Card({val}) {

  return (
        <div className='cardContainer'>
          <img src='/card_empty_sprite.png' alt='blank card' className='card cardBacking'></img>
          <div className='card cardHeader'>{val.card}</div>
          <img src={`/portrait_${val.card}.png`} alt={`${val.card} portrait`} className='card cardPortrait'></img>
          <img src={`/cost_${val.cost}${val.costType}.png`} alt={`${val.card} cost`} className='card cardCost'></img>
          <div className='card cardDamage'>{val.damage}</div>
          <div className='card cardHealth'>{val.health}</div>
          {val.sigils && val.sigils.length > 0 ? 
            <img src={`/ability_${val.sigils[0]}.png`} alt={`${val.sigils[0]} sigil`} className='card cardSigil1'></img>
          : val.sigils && val.sigils.length > 1 ?
            <></>
          : val.sigils && val.sigils.length > 2 ?
            <></>
          : val.sigils && val.sigils.length > 3 ?
            <></>
          : <></>
          }
        </div>
    )
}

export default Card;
