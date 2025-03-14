import './App.css';
import {allSigils} from './cardList';

function Card({val, setHoverHint}) {
  let sigilClasses = ["cardSigilSmall1", "cardSigilSmall2", "cardSigilPatch1", "cardSigilPatch2", "cardSigil1"]

  if (val)
  return (
        <div className='cardContainer'>
          {val.card === "blank" ? <img src='/card_empty_nostats.png' alt='blank card' className='card cardBacking'></img>
          : <img src='/card_empty_sprite.png' alt='blank card' className='card cardBacking'></img>}
          <div className='card cardHeader'>{val.name ? val.name : val.card}</div>
          <img src={`/portrait_${val.card}.png`} alt={`${val.card} portrait`} className='card cardPortrait'></img>
          <img src={`/cost_${val.cost}${val.costType}.png`} alt={`${val.card} cost`} className='card cardCost'></img>
          <div className='card cardDamage'>{val.card === "blank" ? "" : Math.max(val.damage, 0)}</div>
          <div className='card cardHealth'>{val.card === "blank" ? "" : val.health}</div>
          
          {val.sigils.length > val.defaultSigils ? 
            <img src={`/portrait_${val.card}_emission.png`} className='card cardPortrait' style={{filter: "brightness(0) saturate(100%) invert(89%) sepia(20%) saturate(601%) hue-rotate(78deg) brightness(101%) contrast(93%)"}}></img>
          : <></>}
          
          {val.sigils ? val.sigils.map((sigil, i) => {
            let indexAdj = i + 2 - val.defaultSigils;
            if (indexAdj === 1 && val.defaultSigils === 1) {
              indexAdj = 4;
            }

            return ( //FIXME - 3 patches at once still doesn't work
              <div>
                {i >= val.defaultSigils ? 
                  <img src={'./card_added_ability.png'} alt="Added sigil patch" className={`card sigilPatch${i - val.defaultSigils + 1}`}></img>
                : <></>}  
                <img src={`/ability_${val.sigils[i]}.png`} alt={`${val.sigils[i]} sigil`} className={`card ${sigilClasses[indexAdj]}`}></img>
                <img src={`/ability_none.png`} alt={`${val.sigils[i]} sigil`} className={`card ${sigilClasses[indexAdj]}`} style={{zIndex:"100"}}
                onMouseEnter={() => {
                  setHoverHint(`${allSigils[val.sigils[i]][0]}: ${allSigils[val.sigils[i]][1]}`);
                }} onMouseLeave={() => {setHoverHint("")}}></img>
              </div>
            )
          })
          : <></>}
          
        </div>
    )
}

export default Card;
