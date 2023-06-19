import { useState, useEffect, useReducer, useMemo } from 'react';
import { Villager, Trie } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { useStopwatch } from '../utils';
import VillagerIcon from '../components/VillagerIcon';
const API_KEY = import.meta.env.VITE_NOOK_API_KEY;


const fetchVillagers = async () => {
  const response = await fetch(`https://api.nookipedia.com/villagers?nhdetails=true&game=nh&api_key=${API_KEY}`);
  const data = await response.json();
  return data;
}

const reducer = (state: { [key: string]: Villager }, action: { type: string, payload: Villager }) => {
  switch (action.type) {
    case 'add':
      return { ...state, [action.payload.name]: action.payload };
    case 'find':
      if (!state[action.payload.name]) {
        return state;
      }
      const newState = { ...state, [action.payload.name]: { ...state[action.payload.name], found: true } };
      return newState;
    case 'reset-game':
      for (let key in state) {
        state[key].found = false;
      }
      return state;
    default:
      return state;
  }
}

export default function NameGame(): JSX.Element {
  // const [villagersByName, setVillagersByName] = useState<{ [key: string]: Villager }>({});
  // const villagersBySpecies:{ [key: string]: [Villager]} = {};
  
  const {seconds, minutes, hours, isRunning, start, reset} = useStopwatch();
  const initialState = localStorage.getItem('villagers') ? JSON.parse(localStorage.getItem('villagers')||'{}') : {};
  const [villagersByName, dispatch] = useReducer(reducer, initialState);
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [finalTime, setFinalTime] = useState({hours: 0, minutes: 0, seconds: 0});
  const { data: VillagerRawData, isLoading, isError } = useQuery(['villagers'], fetchVillagers, {
    // this will skip the fetch if there's already data in localStorage
    enabled: !initialState || Object.keys(initialState).length === 0,
  });
  useEffect(() => {
      const localVillagers = localStorage.getItem('villagers');
      if (localVillagers && Object.values(JSON.parse(localVillagers)).length > 0) {
        const villagers = JSON.parse(localStorage.getItem('villagers')||'{}') as Record<string, Villager>;
        for (let villager of Object.values(villagers)) {
          dispatch({ type: 'add', payload: villager });
      }
    } else if (VillagerRawData){
      for (let villager of VillagerRawData){
        const insertingVillager : Villager = {
          name: villager.name.toLowerCase(),
          species: villager.species,
          icon_url: villager.nh_details.icon_url,
          found: false
        }
        dispatch({type: 'add', payload: insertingVillager});
      }
    }
  }, [VillagerRawData]);

  useEffect(() => {
    localStorage.setItem('villagers', JSON.stringify(villagersByName));
  }, [villagersByName]);

  const villagersBySpecies = useMemo(() => {
    const speciesMap: { [key: string]: { [key: string]: Villager } } = {};
    Object.values(villagersByName).forEach((villager: Villager) => {
        const lowerCaseName = villager.name.toLowerCase();
        if (speciesMap[villager.species]) {
            speciesMap[villager.species][lowerCaseName] = villager;
        } else {
            speciesMap[villager.species] = { [lowerCaseName]: villager };
        }
    });
    return speciesMap;
  }, [villagersByName]);
  const villagerTrie = useMemo(() => {
    const trie = new Trie();
    Object.keys(villagersByName).forEach((name) => {
      trie.insert(name);
    });
    return trie;
  }, [villagersByName]);
  const villagerTotal = useMemo(() => {
    return Object.keys(villagersByName).length;
  }, [villagersByName]);
  const villagersFound = useMemo(() => {
    return Object.values(villagersByName).filter((villager) => villager.found).length;
  }, [villagersByName]);


  if (VillagerRawData&&isLoading) {
    return <div>Loading...</div>
  }
  else if (VillagerRawData&&isError) {
    return <div>Error</div>
  }
  else{
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setSearchInput(inputValue);

      if (villagerTrie.search(inputValue.toLowerCase())) {
        const villager:Villager = villagersByName[inputValue.toLowerCase()];
        if (villager.found) {
          return;
        }
        dispatch({type: 'find', payload: villager});
        if (!isRunning) {
          start();
        }
        setSearchInput('');
      }
  };

    const formatTime = (time: number) => {
      return time < 10 ? `0${time}` : `${time}`;
    };

    const handleGiveUp = () =>{
      setFinalTime({hours, minutes, seconds});
      reset();
      setShowModal(true);
    }

    const handleReset = () => {
      reset();
      dispatch({ type: 'reset-game', payload: {} as Villager });
      setShowModal(false);
      localStorage.removeItem('villagers');
    }

    const ModalBox = ({
      showModal, 
      villagersFound, 
      villagerTotal, 
      finalTime,
      handleReset
    }: {
        showModal: boolean, 
        villagersFound: number,
        villagerTotal: number,
        finalTime: {hours: number, minutes: number, seconds: number},
        handleReset: () => void
    }): JSX.Element => {
        const { hours, minutes, seconds } = finalTime;
        const timeTextString = `${hours > 1 ? `${hours} hours, ` : ''}${minutes > 1 ? `${minutes} minutes and ` : ''}${seconds} seconds`;
        const [showMore, setShowMore] = useState(false);
        const foundVillagers: Villager[] = Object.values(villagersBySpecies).map((villager) => Object.values(villager).filter((villager) => villager.found)).flat();
        const unfoundVillagers: Villager[] = Object.values(villagersBySpecies).map((villager) => Object.values(villager).filter((villager) => !villager.found)).flat();
        return showModal ? (
            <div className="modal">
                <div className="modal-content">
                    <h1>Nice try!</h1>
                    <p>You found {villagersFound} out of {villagerTotal} villagers in {timeTextString}.</p>
                    <button className="reset-button" onClick={handleReset}>Reset</button>
                    <button className="reset-button" onClick={()=>{ setShowMore(true)}} disabled={showMore}>Show More</button>
                      <>
                      {showMore ? (
                      <>
                        <h2>Here are the villagers you found:</h2>
                        <div className="flex flex-row flex-wrap place-content-evenly">
                          {foundVillagers.map((villager) => (
                            <div className="flex flex-row">
                              <p>{villager.name}</p>
                              <div className='villager-icon'>
                                <img src={villager.icon_url} alt={villager.name}/>
                              </div>
                            </div>
                          ))}
                        </div>
                        <h2>Here are the villagers you didn't find:</h2>
                        <div className="flex flex-row flex-wrap place-content-evenly">
                          { unfoundVillagers.map((villager) => (
                            <div className="flex flex-row">
                              <p>{villager.name}</p>
                              <div className='villager-icon'>
                                <img src={villager.icon_url} alt={villager.name}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      <button className='reset-button' onClick={()=>{ setShowMore(false)}}>Show Less</button>
                      </>
                    ) : <></>}
                      </>
                </div>
            </div>
        ) : <></>;
    }
  


    return (
      <>
        <div className="page-container w-screen h-screen">
          <div className="flex flex-col items-center w-full overflow-auto">          
            <div className="fixed z-10 flex w-full top-20 lg:top-16">
              <div className="absolute top-0 w-full">
                <div className="flex flex-row flex-wrap place-content-evenly">
                  <div className="flex flex-row wood1 nameBox">
                    <h2 className="lg:text-2xl nameVillager font-bold">Name a villager:</h2>
                    <input 
                      type="text"
                      value={searchInput}
                      onChange={handleInputChange}
                      className="h-8 px-3 py-2 mr-4 text-base text-gray-700 placeholder-gray-600 border rounded-3xl focus:shadow-outline inputBox"
                    />
                  </div>
                  
                  <div className="flex flex-row foundBox wood1 upside-down-trapezoid">
                    <p>{villagersFound}/{villagerTotal}</p>
                  </div>
                  
                  <div className="flex flex-row wood1 timerBox upside-down-trapezoid">
                    <p>{formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}</p>
                  </div>

                </div>
              </div>

            </div>
            <div className="flex w-full lg:mt-32 md:mt-40 mt-48 max-w-full max-w-2xl flex-wrap place-content-evenly px-1">
              {Object.keys(villagersBySpecies).map((species) => (
                  <div key={species}>
                      <h2 className="text-xl font-bold">{species}</h2>
                      <div className="icons-container grid lg:grid-cols-8 md:grid-cols-7 grid-cols-5">
                          {Object.keys(villagersBySpecies[species]).map((villagerName) => (
                              <div key={villagerName} className="flex justify-center">
                                  <VillagerIcon villager={villagersBySpecies[species][villagerName]} /> 
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
            </div>

            <div className="flex flex-col w-full fixed b-4">
              <div>
                <button className="text-xl font-bold giveUp"onClick={handleGiveUp}>Give up?</button>
              </div>
            </div>

            <div className="tyBox b-2">
              <p>Project by <a href="https://twitter.com/peeleebee" target="_blank" rel="noopener noreferrer">@Peeleebee</a> let me know if there are any bugs</p>
              <p>Special thanks to <a href="https://nookipedia.com/" target="_blank" rel="noopener noreferrer">Nookipedia</a> for access to their API. </p>
              <p>Inspired by <a href="https://pkmnquiz.com/" target="_blank" rel="noopener noreferrer">pkmnquiz</a> by <a href="https://twitter.com/adeptcharon">AdeptCharon</a> go check him out</p>
              <a href="https://github.com/phill52/nooklook" target="_blank" rel="noopener noreferrer">Source Code</a>
              <p>I develop and host this for free, so <a href="https://ko-fi.com/peeleebee" target="_blank" rel="noopener noreferrer">any donations are appreciated🙏</a></p>
              <p>Animal Crossing characters and artwork used here belong to Nintendo.</p>
            </div>
          </div>
          {showModal && <ModalBox 
              showModal={showModal}
              villagersFound={villagersFound}
              villagerTotal={villagerTotal}
              finalTime={finalTime}
              handleReset={handleReset}
          />}
        </div>
      </>
    )
  }

    

  }

