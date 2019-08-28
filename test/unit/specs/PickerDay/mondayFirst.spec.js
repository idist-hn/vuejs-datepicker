import PickerDay from '@/components/PickerDay.vue'
import { shallowMount } from '@vue/test-utils'

describe('PickerDay: Datepicker with monday as first day of week', () => {
  let wrapper
  beforeEach(() => {
    wrapper = shallowMount(PickerDay, {
      propsData: {
        mondayFirst: true,
        useUtc: true,

        allowedToShowView: () => true,
        pageDate: new Date(2018, 1, 1)
      }
    })
  })

  it('should return Monday as a first day of week', () => {
    expect(wrapper.vm.daysOfWeek[0]).toEqual('Mo')
  })

  it('should return Sunday as a seventh day of week', () => {
    expect(wrapper.vm.daysOfWeek[6]).toEqual('Su')
  })

  // it('should have 6 blankDays when month starts from Sunday', () => {
  //   wrapper.setProps({
  //     pageDate: new Date(2018, 3, 1)
  //   })
  //   expect(wrapper.vm.blankDays).toEqual(6)
  // })

  // it('should have no blankDays when month starts from Monday', () => {
  //   wrapper.setProps({
  //     pageDate: new Date(2018, 9, 1)
  //   })
  //   expect(wrapper.vm.blankDays).toEqual(0)
  // })

  it('should display a first line if sunday is the 1st', () => {
    wrapper.setProps({
      pageDate: new Date(2019, 9, 1)
    })
    expect(wrapper.vm.days[0].date).toEqual(26)
  })
})
