'use strict'

const { CLUSTER, Cluster } = require('zigbee-clusters')

const SrSceneCluster = require('../../lib/SrSceneCluster')
const SrSceneBoundCluster = require('../../lib/SrSceneBoundCluster')

const SrColorControlCluster = require('../../lib/SrColorControlCluster')

const OnOffBoundCluster = require('../../lib/OnOffBoundCluster')
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster')
const ColorControlBoundCluster = require('../../lib/ColorControlBoundCluster')

const ZigBeeRemoteControl = require('../../lib/ZigBeeRemoteControl')

const SrUtils = require('../../lib/SrUtils')

Cluster.addCluster(SrSceneCluster)
Cluster.addCluster(SrColorControlCluster)

class RemoteControl extends ZigBeeRemoteControl {

  async onNodeInit ({ zclNode, node }) {
    await super.onNodeInit({ zclNode, node })

    // Flows

    Object.keys(this.zclNode.endpoints).forEach((endpoint) => {

      this.zclNode.endpoints[endpoint].bind(CLUSTER.ON_OFF.NAME,
        new OnOffBoundCluster({
          onSetOff: this._onOffCommandHandler.bind(this, 'off'),
          onSetOn: this._onOffCommandHandler.bind(this, 'on'),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(CLUSTER.LEVEL_CONTROL.NAME,
        new LevelControlBoundCluster({
          onStepWithOnOff: this._onLevelStepWithOnOff.bind(this),
          onStopWithOnOff: this._onLevelStopWithOnOff.bind(this),
          onMoveWithOnOff: this._onLevelMoveWithOnOff.bind(this),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(SrColorControlCluster.NAME,
        new ColorControlBoundCluster({
          onMoveToColorTemperature: this._onMoveToColorTemperature.bind(this),
          onMoveToHue: this._onMoveToHue.bind(this),
          onMoveToSaturation: this._onMoveToSaturation.bind(this),
          onMoveSaturation: this._onMoveSaturation.bind(this),
          onStopMoveStep: this._onStopMoveStep.bind(this),
          onMoveColorTemperature: this._onMoveColorTemperature.bind(this),
          onStepColorTemperature: this._onStepColorTemperature.bind(this),
          endpoint: endpoint,
        }))

      this.zclNode.endpoints[endpoint].bind(SrSceneCluster.NAME,
        new SrSceneBoundCluster({
          onSrStoreScene: this._onStoreScene.bind(this),
          onSrRecallScene: this._onRecallScene.bind(this),
          endpoint: endpoint,
        }))

    })
  }

  _onOffCommandHandler (type, endpoint) {

    this.log(
      `_onOffCommandHandler => ${type}, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard(type).trigger(this, tokens, state)
  }

  _onMoveToHue ({ hue }, endpoint) {

    const homeyHue = SrUtils.getHomeyHue(hue)
    this.log(`_onMoveToHue hue ${hue}, homey hue ${homeyHue}, ${endpoint}`)

    const tokens = { 'hue': homeyHue }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('move_to_hue').trigger(this, tokens, state)
  }

  _onMoveToSaturation ({ saturation }, endpoint) {

    const homeySaturation = SrUtils.getHomeySaturation(saturation)
    this.log(
      `_onMoveToSaturation ${saturation}, ${homeySaturation}, ${endpoint}`)

    const tokens = { 'saturation': homeySaturation }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('move_to_saturation').
      trigger(this, tokens, state)
  }

  _onMoveSaturation ({ moveMode, rate }, endpoint) {

    this.log(`_onMoveSaturation ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveSaturationMoveModeToken(moveMode),
      'rate': SrUtils.getMoveSaturationRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('move_saturation').
      trigger(this, tokens, state)
  }

  _onRecallScene ({ groupId, sceneId }, endpoint) {

    this.log(`_onRecallScene ${groupId} ${sceneId}, ${endpoint}`)

    const tokens = {
      'group_id': groupId,
      'scene_id': sceneId,
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('recall_scene').
      trigger(this, tokens, state)
  }

  _onStoreScene ({ groupId, sceneId }, endpoint) {

    this.log(`_onStoreScene ${groupId} ${sceneId}, ${endpoint}`)

    const tokens = {
      'group_id': groupId,
      'scene_id': sceneId,
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('store_scene').
      trigger(this, tokens, state)
  }

  _onLevelStepWithOnOff ({ mode, stepSize, transitionTime }, endpoint) {

    const tokens = {
      'mode': SrUtils.getStepLevelModeToken(mode),
      'step_size': SrUtils.getStepLevelStepSizeToken(stepSize),
      'transition_time': Math.floor(transitionTime / 10),
    }
    this.log(
      `_onLevelStepWithOnOff ${mode} ${stepSize} ${transitionTime}, ${endpoint}`)
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('level_step_with_onoff').
      trigger(this, tokens, state)
  }

  _onLevelMoveWithOnOff ({ moveMode, rate }, endpoint) {

    this.log(
      `_onLevelMoveWithOnOff ${moveMode} ${rate}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveLevelMoveModeToken(moveMode),
      'rate': SrUtils.getMoveLevelRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('level_move_with_onoff').
      trigger(this, tokens, state)
  }

  _onLevelStopWithOnOff (endpoint) {

    this.log(
      `_onLevelStopWithOnOff, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('level_stop_with_onoff').
      trigger(this, tokens, state)
  }

  _onStepColorTemperature (
    { stepMode, stepSize, transitionTime, colorTemperatureMinimumMireds, colorTemperatureMaximumMireds },
    endpoint) {

    this.log(
      `_onStepColorTemperature ${stepMode} ${stepSize} ${transitionTime} ${colorTemperatureMinimumMireds} ${colorTemperatureMaximumMireds}, ${endpoint}`)

    const tokens = {
      'step_mode': SrUtils.getStepColorTemperatureStepModeToken(stepMode),
      'step_size': SrUtils.getStepColorTemperatureStepSizeToken(stepSize),
      'transition_time': Math.floor(transitionTime / 10),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('step_color_temperature').
      trigger(this, tokens, state)
  }

  _onMoveToColorTemperature ({ colorTemperature, transitionTime }, endpoint) {

    this.log(
      `_onMoveToColorTemperature ${colorTemperature} ${transitionTime}, ${endpoint}`)

    const tokens = {
      'color_temperature': SrUtils.getColorTemperatureToken(colorTemperature),
      'transition_time': Math.floor(transitionTime / 10),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('move_to_color_temperature').
      trigger(this, tokens, state)
  }

  _onMoveColorTemperature (
    { moveMode, rate, colorTemperatureMinimumMireds, colorTemperatureMaximumMireds },
    endpoint) {

    this.log(
      `_onMoveColorTemperature ${moveMode} ${rate} ${colorTemperatureMinimumMireds} ${colorTemperatureMaximumMireds}, ${endpoint}`)

    const tokens = {
      'move_mode': SrUtils.getMoveColorTemperatureMoveModeToken(moveMode),
      'rate': SrUtils.getMoveColorTemperatureRateToken(rate),
    }
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('move_color_temperature').
      trigger(this, tokens, state)
  }

  _onStopMoveStep (endpoint) {

    this.log(
      `_onStopMoveStep, ${endpoint}`)

    const tokens = {}
    const state = { 'group': endpoint }
    this.driver.getDeviceTriggerCard('stop_move_step').
      trigger(this, tokens, state)
  }

}

module.exports = RemoteControl

/**

 4 Groups

 Input clusters:
 Basic, Power Configuration, Identify, Diagnostics
 [0, 1, 3, 2821]

 Output clusters:
 Identify, Groups, Scene, On/Off, Level control, Ota, Color control
 [3, 4, 5, 6, 8, 25, 768]

 */