import {set, reset} from 'mockdate'

type EventStatus = { status: string}

class CheckLastEventStatus {
    constructor(private readonly loadLastEventRepository: LoadLastEventRepository) {
 }
 
    async perform ({groupID}: {groupID: string}): Promise <EventStatus> {
        const event = await this.loadLastEventRepository.loadLastEvent({groupID})
        if (event === undefined) return {status:'done'} //Se event for igual a undefined, retorna done
        const now = new Date() 
        return event.endDate >= now ? {status:"active"} : {status:'inReview'} // Se o término do event for maior que o agora, retorna active, se não, retorna em Review
 }
}

interface LoadLastEventRepository {
    loadLastEvent: (input: {groupID: string}) => Promise <{endDate: Date, reviewDurationInHours: number} | undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
    groupID?: string //To determinando que o groupID deve ser uma string
    callsCount = 0 //To determinando que a contagem de chamadas, deva começar em 0
    output?: {endDate: Date, reviewDurationInHours: number}  //To determinando que a caracteristica output seja uma endDate ou undefined

    setEndDateAfterNow (): void {
        this.output = {
            endDate: new Date(new Date().getTime() + 1),
            reviewDurationInHours: 1
        }
    }

    setEndDateEqualToNow (): void {
        this.output = {
            endDate: new Date(),
            reviewDurationInHours: 1
        }
    }

    setEndDateBeforeNow (): void {
        this.output = {
            endDate: new Date(new Date().getTime() - 1),
            reviewDurationInHours: 1
        }
    }

 /*   setNowBeforeReviewTime (): void {
        const reviewDurationInHours = 1
        const reviewDurationInMs = reviewDurationInHours*60*60*100
        this.output = {
            endDate: new Date(new Date().getTime() - reviewDurationInMs + 1),
            reviewDurationInHours
        }
    } */

    async loadLastEvent ({groupID}: {groupID: string}): Promise <{endDate: Date, reviewDurationInHours: number} | undefined> {
        this.groupID = groupID //To falando que o groupID do Spy, é igual ao groupID carregado
        this.callsCount++ //To somando +1 na chamada
        return this.output //To pedindo para ele retornar o valor de output
    }
}
type SutOutput = {
    sut: CheckLastEventStatus, 
    loadLastEventRepository:LoadLastEventRepositorySpy 
}

const makeSut = (): SutOutput => { //Factory Pattern
    const loadLastEventRepository = new LoadLastEventRepositorySpy()
    const sut = new CheckLastEventStatus(loadLastEventRepository)
    return {
        sut,
        loadLastEventRepository
    }
}

describe('CheckLastEventStatus', () => {
    const groupID = 'any_group_id'
    beforeAll(() => {
        set(new Date())
    })
    afterAll(() => {
        reset()
    })

    it('Should get last event data', async () => {
        const {sut, loadLastEventRepository} = makeSut()

        await sut.perform({groupID})

        expect(loadLastEventRepository.groupID).toBe(groupID) //To esperando como resposta do meu teste, que o groupID seja igual ao groupID do repositorio
        expect(loadLastEventRepository.callsCount).toBe(1) //To esperando como resposta apenas uma "chamada" do groupID
    })

    it('Should return status done when group has no event', async () => {
        
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.output = undefined

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('done') //To esperando como resposta do meu teste, que o status seja a done     
    })

    it('Should return status active when now is before event end time', async () => {
        
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.setEndDateAfterNow()

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('active') //To esperando como resposta do meu teste, que o status seja a active  
    })

    it('Should return status active when now is equal to event end time', async () => {
        
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.setEndDateEqualToNow()

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('active') //To esperando como resposta do meu teste, que o status seja a active  
    })

    it('Should return status inReview when now is after event end time', async () => {
        
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.setEndDateBeforeNow()

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('inReview') //To esperando como resposta do meu teste, que o status seja a inReview  
    })

    it('Should return status inReview when now is before event review time', async () => {
        const reviewDurationInHours = 1
        const reviewDurationInMs = reviewDurationInHours*60*60*100
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.output = {endDate: new Date(new Date().getTime() - reviewDurationInMs + 1),
            reviewDurationInHours

        }

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('inReview') //To esperando como resposta do meu teste, que o status seja a inReview  
    })

    it('Should return status inReview when now is equal to review time', async () => {
        const reviewDurationInHours = 1
        const reviewDurationInMs = reviewDurationInHours*60*60*100
        const {sut, loadLastEventRepository} = makeSut()
        loadLastEventRepository.output = {endDate: new Date(new Date().getTime() - reviewDurationInMs),
            reviewDurationInHours

        }

        const eventStatus = await sut.perform({groupID})

        expect(eventStatus.status).toBe('inReview') //To esperando como resposta do meu teste, que o status seja a inReview  
    })
})
